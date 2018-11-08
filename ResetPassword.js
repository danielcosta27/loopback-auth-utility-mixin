var path = require('path');

module.exports = function (Model, options) {

    Model.on('attached', function () {

        /**
         *
         */
        Model.app.get('/request-password-reset', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/reset-password.html'));
        });

        /**
         *
         */
        Model.app.get('/confirm-password-reset', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/confirm-password.html'));
        });

        /**
         *
         */
        Model.app.post('/request-password-reset', function (request, response, next) {
            Model.resetPassword({
                email: request.body.email
            }, function (err) {
                if (err) return response.status(401).send(err);
                else return response.status(200).send({
                    statusCode: 200,
                    message: 'We have sent you a email. Please check your email to reset your password'
                });
            });
        });

        /**
         *
         */
        Model.app.post('/confirm-password-reset', function (request, response, next) {
            if (!request.accessToken && !request.query.access_token) {
                return response.status(404).send({
                    error: 'Incorrect Token',
                    statusCode: 404,
                    message: 'Valid token not found'
                });
            }

            if (!request.accessToken) {
                Model.app.models.AccessToken.findById(request.query.access_token, function (err, accessToken) {
                    if (err)
                        return response.status(404).send(err);
                    else {
                        findUserAndSavePassword(accessToken.userId);
                    }
                })
            } else {
                findUserAndSavePassword(request.accessToken.userId);
            }

            function findUserAndSavePassword(userId) {
                Model.findById(userId, function (err, user) {
                    if (err)
                        return response.status(404).send(err);
                    else {
                        user.updateAttribute('password', request.body.password, function (err, res) {
                            if (err) return response.status(404).send(err);
                            return response.status(200).send({
                                statusCode: 200,
                                message: 'Password reset successfully'
                            });
                        });
                    }
                });
            }


        });
    });

    Model.on('resetPasswordRequest', function (info) {
        var settings = Model.app.settings;
        var Email = Model.app.models.Email;

        var html = 'Click on <a href="' + settings.protocol + '://' + (settings.hostnameApp || settings.host) + ':' + settings.port + '/confirm-password-reset?access_token=' + info.accessToken.id + '">this</a> url to reset your password';

        Email.send({
                from: "no-reply@knowapp.com",
                to: info.user.email,
                subject: 'Reset your password',
                html: html
            })
            .then(function (response) {
                console.log('success from the mailer', response);
            })
            .catch(function (err) {
                console.log('error from the mailer', err);
            });
    });

};
