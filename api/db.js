var mongoose = require('mongoose');
var moment = require('moment');
var mongodbURL = 'mongodb://localhost:27017/appointments';
var mongodbOptions = { useUnifiedTopology: true, useNewUrlParser: true };

mongoose.connect(mongodbURL, mongodbOptions);

var Schema = mongoose.Schema;
var returnModel = {};

var appointmentsSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    appointment: { type: Date, required: true, unique: true }
});
/*
------------------------------
--
Function used for checking if appointment is already taken this week
--
------------------------------
*/
appointmentsSchema.pre('save', function (next) {	
	var getMonday = new Date(this.appointment);
	var getSunday = new Date(this.appointment);
	var userSelectedDay = getMonday.getDay();
	var userSelectedMonthDay = getMonday.getDate()
	getMonday.setDate(userSelectedMonthDay - (userSelectedDay)); // We set when monday day is
	getSunday.setDate(userSelectedMonthDay + (6 - userSelectedDay)); // We set when sunday day is
	
	var minutesPlusDoctorWork = moment(this.appointment).add(30, 'm').toDate();
	var minutesMinusDoctorWork = moment(this.appointment).subtract(30, 'm').toDate();

	returnModel.appointmentModel.find(
	{
		$or: [
			//Client already registered this week
			{"firstname": this.firstname, "lastname": this.lastname, "appointment": {$gte: getMonday,$lte: getSunday}},
			//If client is trying to make appointment e.g. 12:10, but doctor has appointment on (12:11 or 12:20 or 12:30 - we need to let doctor to work for 30 minutes at least)
			{"appointment":{ $gte: this.appointment, $lt: minutesPlusDoctorWork }},
			//If client is trying to make appointment e.g. 12:10, but doctor has appointment on (12:08 or 12:00 or 11:45 - we need to let doctor to work for 30 minutes at least)
			{"appointment":{$gte: minutesMinusDoctorWork,$lt: this.appointment}}
]
	}, function (err, appoints) {
		// If we found appointments - this means that doctor is busy that time
		if (appoints.length == 0){
			next();
		}else{
			next(new Error("Appointment is taken"));
		}
	});
});

returnModel.appointmentModel = mongoose.model('appointment', appointmentsSchema);
exports.appointmentModel = returnModel.appointmentModel;
