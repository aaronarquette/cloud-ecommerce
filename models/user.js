'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.UserDetail, { foreignKey: 'UserId' });
      User.belongsToMany(models.Game, {
        through: models.GameUser,
        foreignKey: 'UserId'
      });
    }
  }
 
  User.init({
    username: {
      type: DataTypes.STRING,
      // GETTER: username selalu ditampilkan dengan huruf kapital di awal tiap kata
      get() {
        const raw = this.getDataValue('username');
        if (!raw) return raw;
        return raw
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    },
    email: {
      type: DataTypes.STRING,
      // SETTER: email selalu disimpan dalam huruf kecil
      set(value) {
        this.setDataValue('email', value?.toLowerCase().trim());
      }
    },
    password: {
      type: DataTypes.STRING,
      // SETTER: hash otomatis saat password di-set langsung via instance
      // (hooks lebih diutamakan, ini sebagai fallback)
      set(value) {
        if (value && !value.startsWith('$2')) {
          this.setDataValue('password', bcrypt.hashSync(value, 10));
        } else {
          this.setDataValue('password', value);
        }
      }
    },
    role: DataTypes.STRING,
    balance: {
      type: DataTypes.INTEGER,
      // GETTER: tampilkan balance dalam format Rupiah
      get() {
        const raw = this.getDataValue('balance');
        if (raw === null || raw === undefined) return raw;
        return `Rp ${raw.toLocaleString('id-ID')}`;
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      // HOOK beforeCreate: hash password sebelum user baru disimpan ke DB
      beforeCreate: async (user) => {
        if (user.password && !user.password.startsWith('$2')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
 
      // HOOK beforeUpdate: hash password baru jika password diubah
      beforeUpdate: async (user) => {
        if (user.changed('password') && !user.password.startsWith('$2')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });
 
  return User;
};