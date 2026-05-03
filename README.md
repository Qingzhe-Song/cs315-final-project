# CS315 Final Project - Steam Game Insights

This repository contains a frontend, a PHP backend, SQL setup scripts, and data-loading scripts for the project database.

## 1. Get the Project

You can either install the whole project folder from Gradescope or clone it from GitHub:

```bash
git clone https://github.com/Qingzhe-Song/cs315-final-project
cd cs315-final-project
```

## 2. Download the Data

Before setup, download the `clean` folder from OneDrive and unzip it:

https://livejohnshopkins-my.sharepoint.com/:f:/g/personal/qsong12_jh_edu/IgC0CwoYbiGsSo2WcZzXhCicAYJhSTNDg7pkOYz9ZOY4kl8?e=TJr9aF

Move the unzipped `clean` folder into the project home directory:

```text
cs315-final-project/
  clean/
  app/
  sql/
```

Do not rename the `clean` folder. The database load script expects CSV files at paths like `clean/Developer.csv`.

## 3. Set Up the Frontend

Go to the frontend folder:

```bash
cd app/frontend
```

Copy the frontend environment file:

```bash
cp .env.example .env
```

Keep the file contents unchanged:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Make sure `npm` is installed, then install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Leave the frontend running and open another terminal for the backend and database setup.

## 4. Install MariaDB

Make sure MariaDB is installed on the same system where the app is running. For example, if the app is running inside WSL, then MariaDB should also be installed and started inside WSL. Do not run MariaDB on Windows while running the app in WSL, because localhost will refer to different environments and the app may not be able to connect correctly.

Install a local MariaDB Server. The official installation guide is here:

https://mariadb.com/docs/server/mariadb-quickstart-guides/installing-mariadb-server-guide

After MariaDB is installed, log in to MariaDB from the project home directory. This matters because `sql/setup/load.sql` uses relative paths to load files from the `clean` folder.

```bash
cd /path/to/cs315-final-project
mariadb --local-infile=1 -u root -p
```

If your system uses the `mysql` client command instead, this is also fine:

```bash
mysql --local-infile=1 -u root -p
```

## 5. Create the Database and User

Inside MariaDB, create and use a project database:

```sql
CREATE DATABASE database_name;
USE database_name;
```

Create a database user:

```sql
CREATE USER username@localhost IDENTIFIED BY 'Password';
```

Grant the user privileges on the project database:

```sql
GRANT ALL PRIVILEGES ON database_name.* TO username@localhost;
FLUSH PRIVILEGES;
```

Replace `database_name`, `username`, and `Password` with the values you want to use.

## 6. Load the Database

Run the setup scripts from inside MariaDB while your current shell directory is still the project home directory:

```sql
SOURCE sql/setup/setup.sql;
SOURCE sql/setup/load.sql;
```

The load script will fail if MariaDB was not started from the project home directory because it depends on relative paths such as `clean/Game.csv`.

If loading fails because local file loading is disabled, reconnect with:

```bash
mariadb --local-infile=1 -u root -p
```

Then run the setup and load scripts again.

Load the stored procedures:

```sql
SOURCE sql/query/procedures.sql;
```

Create the indexes:

```sql
SOURCE sql/index/index.sql;
```

## 7. Database Cleanup Scripts

If you need to clean part of the database setup, use the cleanup script in the relevant SQL subfolder:

```sql
SOURCE sql/setup/cleanup.sql;
SOURCE sql/query/cleanprocedure.sql;
SOURCE sql/index/cleanindex.sql;
```

Use only the cleanup script that matches what you want to remove.

## 8. Set Up the Backend

Open a new terminal and go to the backend folder:

```bash
cd app/backend
```

Copy the backend environment file:

```bash
cp .env.example .env
```

Edit `app/backend/.env` with the database information you created:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=database_name
DB_USER=username
DB_PASS=Password
DB_CHARSET=utf8mb4
```

Keep the backend port unchanged because the frontend expects the backend at `http://127.0.0.1:8000`.

Make sure PHP is installed, then start the backend:

```bash
php -S 127.0.0.1:8000 -t public
```

## 9. Open the Application

With the frontend and backend both running, open:

http://localhost:5173/

The application should now be fully functional.

