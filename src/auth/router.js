'use strict';

import superagent from 'superagent';
import express from 'express';
const authRouter = express.Router();

import User from './model.js';
import auth from './middleware.js';

// Generally, these will send a Token Cookie and do a redirect.
// For now, just spew out the token to prove we're ok.

authRouter.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user.save()
    .then( user => res.send(user.generateToken()) )
    .catch(next);
});

authRouter.get('/signin',auth, (req, res, next) => {
  res.cookie('Token', req.token);
  res.send(req.token);
});

authRouter.get('/oauth/fb/code', (req, res, next) => {

  let URL = process.env.CLIENT_URL;
  let code = req.query.code;
  console.log(req.query);

  console.log('(1) code', code);

  // let options = {
  //   client_id:'1990591931252165',
  //   redirect_uri: 'https://localhost:3000/oauth/fb/code',
  //   client_secret: 'fc5462d99dde853cddfdd5cea61b07cd',
  //   code: 'code'
  // }

  // exchange the code or a token
  superagent.post(`https://graph.facebook.com/v3.0/oauth/access_token?client_id=1990591931252165&redirect_uri=https://localhost:3000/oauth/fb/code&client_secret=fc5462d99dde853cddfdd5cea61b07cd&code=${code}`)
    // .type('form')
    // .send({
    //   code: `${code}`,
    //   client_id: process.env.FB_CLIENT_ID,
    //   client_secret: process.env.FB_CLIENT_SECRET,
    //   redirect_uri: `${process.env.API_URL}/oauth/fb/code`,
    //   grant_type: 'authorization_code',
    // })
    .then( response => {
      //console.log(response.body);
      let FBToken = response.body.access_token;
      console.log('(2) FB token', FBToken);
      return FBToken;
    })
  // use the token to get a user
    .then ( token => {
      return superagent.get('https://graph.facebook.com/me')
        .set('Authorization', `Bearer ${token}`)
        .then (response => {
          console.log(response);
          let user = response.text;
          console.log('(3) FB User', user);
          return user;
        });
    })
    .then(FBUser => {
      console.log('(4) FB User', FBUser);
      return User.createFromOAuth(FBUser);
    })
    .then ( user => {
      console.log('(5) user', user);
      return user.generateToken();
    })
    .then ( token => {
      console.log('(6) token', token);
      res.cookie('Token', token);
      res.redirect(URL);
    })
    .catch( error => {
      console.log('ERROR', error.message);
      next(error);
      // res.redirect(URL);
    });

});

authRouter.get('/showMeTheMoney', auth, (req,res,next) => {
  res.send('Here is all the ca$h');
});

export default authRouter;
