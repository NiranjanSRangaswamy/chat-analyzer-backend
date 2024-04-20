const http = require('http')
const app = require('./app')
const {sequelize} = require('./models')

http.createServer(app).listen(process.env.PORT, async () => {
    try {
      await sequelize.sync();
      console.log("database connected");
      console.log(`server running on port ${process.env.PORT}`);
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  });

module.exports = sequelize