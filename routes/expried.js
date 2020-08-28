const { Logger } = require("mongodb");


const handle_expried = (time_active, max_age)=>{
    // console.log(time_active);
    // console.log(max_age);
    var d = new Date();
    var time = {
        fullYear: d.getFullYear(),
        month: d.getMonth()+1,
        date: d.getDate(),
        h: d.getHours(),
        m: d.getMinutes(),
        s: d.getSeconds()
    }
    const time_value_1 = time.fullYear*12*30*24*60*60 + time.month*30*24*60*60 + time.date*24*60*60 + time.h*60*60 + time.m*6- + time.s;
    const time_value_2 = time_active.fullYear*12*30*24*60*60 + time_active.month*30*24*60*60 + time_active.date*24*60*60 + time_active.h*60*60 + time_active.m*6- + time_active.s;

    if (time_value_1 - time_value_2 > max_age) return false // hết hạn
    return true
}

const create_time = ()=>{
    var d = new Date();
    var time = {
        fullYear: d.getFullYear(),
        month: d.getMonth()+1,
        date: d.getDate(),
        h: d.getHours(),
        m: d.getMinutes(),
        s: d.getSeconds()
    }
    // var time_value = time.fullYear*99999 + d.month*9999 + d.date*999 + d.h*99 + d.m*9 + d.s
    return time;
}

module.exports = {
    create_time: create_time,
    handle_expried: handle_expried
}
