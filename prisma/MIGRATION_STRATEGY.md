# CampusFlow Prisma Migration Strategy

## 1. Environment setup

- Keep separate PostgreSQL databases for `local`, `staging`, and `production`.
- Enable Prisma migrations from the start. Do not use `prisma db push` against staging or production.
- Store `DATABASE_URL` and `DIRECT_URL` in the platform secret manager, not in committed files.

## 2. Local development

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name init_examdesk_core
npx prisma db seed
```

Use descriptive migration names:

```txt
init_examdesk_core
add_ocr_documents
add_result_moderation
add_notification_delivery_status
```

## 3. Staging release flow

```bash
npx prisma migrate deploy
npx prisma generate
```

After deploy, run smoke checks for:

- Auth login and role routing.
- Exam schedule creation.
- Room allocation.
- Invigilator assignment.
- Marks entry and result calculation.
- Student portal result visibility.

## 4. Production release flow

- Take a database backup before every schema migration.
- Run migrations during a low-traffic maintenance window for destructive or large-table changes.
- Use expand-and-contract migrations for breaking changes.
- Never drop columns or enum values in the same release that removes their application usage.

## 5. Expand-and-contract example

1. Add the new nullable column or table.
2. Deploy application code that writes both old and new shapes.
3. Backfill existing records with a script or worker.
4. Deploy application code that reads only the new shape.
5. Drop the old column in a later migration.

## 6. Data integrity rules

- Users cascade to their Student or Faculty profile.
- Departments are restricted from deletion while active classes, subjects, or faculty exist.
- Exams cascade to schedules, marks, attendance, assignments, and results.
- Subjects and rooms are restricted from deletion once used by exam records.
- Audit logs preserve history by setting actor references to null if a user is removed.

## 7. Operational notes

- Add OCR document tables in a later migration when the AI scanning workflow is implemented.
- Add partial indexes manually with SQL migrations if high-volume production queries need them.
- Review enum changes carefully because PostgreSQL enum rollback behavior is limited.
