# SkillSprint

A small web app with a PHP/MySQL backend and a static HTML/CSS/JS frontend. It includes login, dashboard, battles, challenges, quiz, leaderboard, and profile pages.

## Features

- Login and registration flow with a themed auth portal
- Dashboard and game-style pages (battles, challenges, quiz)
- Leaderboard and profile views
- PHP API endpoints for users, quiz, battles, challenges, and leaderboard

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: PHP (API endpoints)
- Database: MySQL (SQL scripts in database/)
- Optional: Python/Flask service in backend/python/

## Project Structure

- frontend/ - static pages and assets
- backend/php/ - PHP API endpoints
- backend/python/ - Flask service (optional)
- database/ - SQL scripts

## Quick Start (XAMPP)

1. Place the project in your XAMPP htdocs folder, for example:
   /Applications/XAMPP/xamppfiles/htdocs/p2/skillsprint
2. Start Apache and MySQL in XAMPP.
3. Import the database:
   - Open phpMyAdmin
   - Create a database (for example, skillsprint)
   - Import database/skillsprint_new.sql
4. Open the app:
   http://localhost/p2/skillsprint/frontend/index.html

## Login Test Credentials

These are verified in LOGIN_GUIDE.md:

- Email: demo@skillsprint.io
- Password: 12345678

Auth page:
http://localhost/p2/skillsprint/frontend/auth.html

## API Testing

- API test page: http://localhost/p2/skillsprint/frontend/api-test.html
- Troubleshooting page: http://localhost/p2/skillsprint/frontend/troubleshoot.html

## Notes

- If you see login errors, check the browser console and ensure Apache/MySQL are running.
- The PHP API base is expected to be http://localhost/p2/skillsprint/backend/php

## License

Add your license here.
