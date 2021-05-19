var db = require('./db');
var moment = require('moment');

exports.getAll = function(req, res) {
	var dateNow = new Date();
	var monthBefore = moment(dateNow).subtract(1, 'M').toDate();
	var monthThreeGo = moment(dateNow).add(3, 'M').toDate();
	
	var query = db.appointmentModel.find(
	{$or: [
		//Load appointmens that are no later that three months
		{"appointment":{$gte: dateNow,$lt: monthThreeGo}},
		//Load appointmens that are no earlier that one month
		{"appointment":{$gte: monthBefore,$lt: dateNow}}
	]
	});
	
	query.exec(function(err, result) {
		if (err) {
			console.log(err);
			return res.sendStatus(400);
		}
		
		if (result != null) {
			return res.status(200).json(result);
		} else {
			return res.sendStatus(400);
		}
	});
};

exports.create = function(req, res){
	var appointment = req.body;
	if (appointment == null || appointment.firstname == null || appointment.lastname == null
	 || appointment.appointmentDate == null || appointment.appointmentTime == null
	 || appointment.firstname == "" || appointment.lastname == ""
	 || appointment.appointmentDate == "" || appointment.appointmentTime == "") {
		return res.sendStatus(400);
	}
	
	var validateDate = validateDateValue(appointment.appointmentDate);
	var validateTime = validateTimeValue(appointment.appointmentTime);
	
	if (validateDate || validateTime) {
		return res.sendStatus(400);
	}

	//Validate date and time according to format
	if (!moment(appointment.appointmentDate+" "+appointment.appointmentTime, "YYYY-MM-DD HH:mm").isValid()) {
		return res.sendStatus(400);
	}
	
	var appointmentModel = new db.appointmentModel();
	appointmentModel.firstname = appointment.firstname;
	appointmentModel.lastname = appointment.lastname;
	var appointmentDate = new Date(appointment.appointmentDate+" "+appointment.appointmentTime);
	appointmentModel.appointment = appointmentDate;
	
	appointmentModel.save(function(err, result) {
		if (err) {
			return res.sendStatus(400);
		}
		
		return res.sendStatus(200);
	});
};

function validateDateValue(newValue) {
	var showError = false;
	
	if (newValue == "") {
		showError = true;
	}else{
		var checkTime = newValue.split("-");
		// Hour:Minutes - so should be only two values
		if (checkTime.length == 3) {
			var year = parseInt(checkTime[0]);
			var month = parseInt(checkTime[1]);
			var day = parseInt(checkTime[2]);
			
			var todayDate = getTodayTime();
			
			if (todayDate.year <= year) {
				if (todayDate.month > month) {
					showError = true;
				}else{
					//If it is same month - but day is less than today - show error
					if (todayDate.month == month && todayDate.day > day) {
						showError = true;
					}
				}
			}else{
				showError = true;
			}
		}else{
			showError = true;
		}
	}
	
	return showError;
}

function getTodayTime() {
	var today = new Date();
	var dd = today.getDate();
	var MM = today.getMonth() + 1;
	var yyyy = today.getFullYear();
	
	return { day: dd, month: MM, year: yyyy };
}

function validateTimeValue(newValue) {
	var showError = false;
	
	if (newValue == "") {
		showError = true;
	}else{
		var checkTime = newValue.split(":");
		if (checkTime.length == 2) {
			var hour = parseInt(checkTime[0]);
			// From 8 to 17 hour working
			if (!(hour > 7 && hour < 17)) {
				showError = true;
			}
		}else{
			showError = true;
		}
	}
	
	return showError;
}