// Student Schema
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    // other fields...
});

// Course Schema
const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    // other fields...
});

// Ensure both schemas have text indexes for the name fields
studentSchema.index({ name: 'text' });
courseSchema.index({ name: 'text' });
