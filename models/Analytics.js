'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Analytics extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Analytics.init({
    user_count: {
      type: DataTypes.INTEGER
    },
    zip_count: {
      type: DataTypes.INTEGER
    },
    txt_count: {
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'analytics',
    modelName: 'analytics',
  });
  return Analytics;
};