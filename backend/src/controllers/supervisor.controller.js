const Note = require("../models/Note");

exports.getClientNotes = async (req, res) => {
  const notes = await Note.find({ clientId: req.params.clientId })
    .populate("staffId", "name");
  res.json(notes);
};

exports.verifyNote = async (req, res) => {
  const note = await Note.findByIdAndUpdate(
    req.params.noteId,
    { verified: true },
    { new: true }
  );
  res.json(note);
};
