const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, { // коннектим mongoose к базе данных и сразу в пути объявляем для него имя
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
