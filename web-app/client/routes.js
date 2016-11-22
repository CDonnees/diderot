import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/', {
  name: 'Home',
  action() {
    BlazeLayout.render('Layout', { main: 'Home' });
  },
});

FlowRouter.route('/answer/:id', {
  name: 'AnswerPage',
  action() {
    BlazeLayout.render('Layout', { main: 'AnswerPage' });
  },
});

