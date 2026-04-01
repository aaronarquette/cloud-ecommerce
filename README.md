# Cloud.gg Game Market
An E-commerce game market concept built on the Express.js framework using Node.js.

## Features
1. Built using Javascript
2. Uses Express.js for routing
3. Uses PostgreSQL as database, embedded using Sequelize using the node-postgres library.
4. Uses EJS as a templating engine for loading html files.

## Routing
### Fitur Akun
| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | / | Tampilan Home Page |
| GET | /login | Tampilan Login Page |
| POST | /login | Login lalu redirect ke homepage |
| GET | /login/register | Tampilan Register Page |
| POST | /login/register | Register lalu redirect ke login |
| GET | /profile/:username | Tampilan Profil |

### Fitur Beli Game
| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | /game/:id | Tampilan detail game |
| GET | /game/:id/buy | Tampilan beli game |
| POST | /game/:id/buy | Beli game lalu redirect ke profil |

