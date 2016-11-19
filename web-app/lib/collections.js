import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const Searches = new Mongo.Collection('searches');

Searches.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  userId: { type: String, optional: true },
  originalInput: { type: String },
  finalInput: { type: String, optional: true },
  selectedAnswerId: { type: String, optional: true },
  answersIds: { type: [String], defaultValue: [] },
});

Searches.attachSchema(Searches.schema);
