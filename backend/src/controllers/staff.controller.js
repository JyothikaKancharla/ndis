const Note = require("../models/Note");

exports.createNote = async (req, res) => {
  const note = await Note.create({
    ...req.body,
    staffId: req.user.id
  });
  res.json(note);
};

exports.getMyNotes = async (req, res) => {
  const notes = await Note.find({ staffId: req.user.id });
  res.json(notes);
};
