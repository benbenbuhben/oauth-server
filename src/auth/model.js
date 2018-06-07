'use strict';

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  FBid: {type: String, required: true},
});

// Before we save, hash the plain text password
userSchema.pre('save', function(next) {
  bcrypt.hash(this.password,10)
    .then(hashedPassword => {
      // Update the password for this instance to the hashed version
      this.password = hashedPassword;
      // Continue on (actually do the save)
      next();
    })
    // In the event of an error, do not save, but throw it instead
    .catch( error => {throw error;} );
});

userSchema.statics.createFromOAuth = function(incoming) {
  /*
    {
      kind: 'plus#personOpenIdConnect',
      sub: '100592365129823370453',
      name: 'John Cokos',
      given_name: 'John',
      family_name: 'Cokos',
      picture: 'https://lh4.googleusercontent.com/-qN0rHFTCPXY/AAAAAAAAAAI/AAAAAAAAAAw/lGUgjyX0vIc/photo.jpg?sz=50',
      email: 'john@codefellows.com',
      email_verified: 'true',
      locale: 'en',
      hd: 'codefellows.com'
    }
   */

   console.log('LOOOOK HEEEERE,', incoming);
   incoming=JSON.parse(incoming);

  if ( ! incoming || ! incoming.id) {
    return Promise.reject('VALIDATION ERROR: missing username or id');
  }

  return this.findOne({FBid: incoming.id})
    .then(user => {
      if ( ! user ) { throw new Error ('User Not Found'); }
      console.log('Welcome Back', user.name);
      return user;
    })
    .catch( error => {
    // Create the user
      // let username = incoming.email;
      // let password = 'none';
      return this.create({
        username: incoming.name,
        password: 'none',
        FBid: incoming.id,
      });
    });

};

// If we got a user/password, compare them to the hashed password
// return the user instance or an error
userSchema.statics.authenticate = function(auth) {
  let query = {username:auth.username};
  return this.findOne(query)
    .then(user => user && user.comparePassword(auth.password))
    .catch(error => error);
};

userSchema.statics.authorize = function(token) {
  let parsedToken = jwt.verify(token, process.env.APP_SECRET || 'changeit');
  let query = {_id:parsedToken.id};
  return this.findOne(query)
    .then(user => {
      // looked up their role and then all capabilities
      return user;
    })
    .catch(error => error);
};

// Compare a plain text password against the hashed one we have saved
userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password)
    .then(valid => valid ? this : null);
};

// Generate a JWT from the user id and a secret
userSchema.methods.generateToken = function() {
  console.log('made it to generateToken()')
  return jwt.sign( {id:this._id}, process.env.APP_SECRET || 'changeit' );
};

export default mongoose.model('users', userSchema);
