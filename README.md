<div align="center">

# PastePick Server
**Node server application for PastePick**

![GitHub Release](https://img.shields.io/github/v/release/IngrdInsight/PastePick-server)
![GitHub License](https://img.shields.io/github/license/IngrdInsight/PastePick-server)
![GitHub repo size](https://img.shields.io/github/repo-size/IngrdInsight/PastePick-server)

</div>

---

## Download and Install

### Clone the Repository

To clone the repository:
```bash
git clone https://github.com/IngrdInsight/PastePick-server.git
```

### Installation Instructions

After cloning, navigate to the root directory:

1. Install pnpm
2. Run `pnpm install`
3. Start a PostgreSQL database and connect to it
4. Set the variables in `.env` and `src/database/connection.js`
4. During the **initial** server run, uncomment the code in `src/database/initialization.js` and import it in `server.js` to initialize the database (do not keep it enabled after the first run)
5. Run the server

> [!NOTE]
> Having issues with Husky? Run `npx husky install`

Scripts can be found in `package.json`. Main ones:

* `pnpm dev`
* `pnpm start`

---

## Reporting Bugs

Bug reports help us improve PastePick.

* Open an issue on GitHub: [New Issue](https://github.com/IngrdInsight/PastePick-server/issues/new)

---

## Contributing

We appreciate all contributions to PastePick!

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Submit a pull request
