# LibraryManagementSystem
This is a CLI-based application with relational database integration that lets users with basic functionalities of a library

Each user has their personal shelf


Add node_modules: `npm install`

The DB is not hosted currently.
download **MYSQL**
run the following queries to get started:
MYSQL
1. create a database "library"
`CREATE DATABASE IF NOT EXISTS library;`

3. create table "books"
```
CREATE TABLE IF NOT EXISTS books (
    bookId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    bookName VARCHAR(50) UNIQUE,
    quantityAvailable INT
);
```

4. create table "users"
```
CREATE TABLE IF NOT EXISTS users (
    userId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) DEFAULT session_user,
    phno VARCHAR(10),
    password VARCHAR(50)
);
```

5. create table "user_books"
```
CREATE TABLE IF NOT EXISTS user_books (
    userBookId INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(50),
    bookName VARCHAR(50)

);
```
