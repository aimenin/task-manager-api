const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('./task.model');

// создаем схему сами, чтобы начать пользоваться мидллварами
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true // удаляет все пустое пространство
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate: (value) => {
            if (!validator.isEmail(value)) {
                throw new Error('you must provide a correct email');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate: (value) => {
            if (value.toLowerCase().includes('password')) {
                throw new Error('you cant use password as password');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate: (value) => {
            if (value < 0) {
                throw new Error('age must be a posotive number');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// настраиваем взаимодействие между двумя коллекциями
// localField - это поле по которому настроено взаимодействие в этой коллекции
// foreignField - это поле по которому настроено взаимодействе во второй коллекции
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

// methods - методы которые относятся к индивидуальному юзеру
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// добавляем своей метод к модели User
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
}

// statics - методы, которые относятся ко всей модели User
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
}

// метод pre позволяет сделать что то перед совершением действия с моделью
// хэшим пароль перед сохранением его в бд
userSchema.pre('save', async function(next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

// Удаляет tasks пользователя, кошда он удаляет свой аккаунт
userSchema.pre('remove', async function (next) {
    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();
});

// создаем схему User, она описывает все поля, которыми представлен объект юзер
const User = mongoose.model('User', userSchema);

module.exports = User;