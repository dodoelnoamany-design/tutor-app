Place the update icon image here and name it `update-icon.png`.

This project expects the refresh/update button image at `/assets/update-icon.png`.

To install the image you attached (app icon) as the update icon:
1. Save the attached image locally as `update-icon.png`.
2. Put it in `public/assets/` (create the folder if it doesn't exist).
3. Commit and push:

```bash
git add public/assets/update-icon.png
git commit -m "chore(assets): add update icon for refresh buttons"
git push origin main
```

Notes:
- The UI already references `/assets/update-icon.png` in `components/AppointmentsSchedule.tsx` and `components/SchoolSchedule.tsx`.
- If you prefer a different size or format, use a 72–192px square PNG for best results.
