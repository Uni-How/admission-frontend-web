import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Sub-Schemas for Admission Data (from Department) ---

const ExamThresholdSchema = new Schema({
  subject: { type: String, required: true },
  exam_type: { type: String, required: true },
  threshold: { type: String, required: true },
}, { _id: false });

const SelectionMultiplierSchema = new Schema({
  subject: { type: String, required: true },
  multiplier: { type: Number, default: null },
  order: { type: Number },
}, { _id: false });

const ScoringWeightSchema = new Schema({
  subject: { type: String, required: true },
  source_type: { type: String, required: true },
  multiplier: { type: Number, required: true },
  order: { type: Number }, // Order for tie-breaking
}, { _id: false });

const ScoreStandardSchema = new Schema({
  top: Number,
  front: Number,
  average: Number,
  back: Number,
  bottom: Number,
}, { _id: false });

const AssessmentStandardsSchema = new Schema({
  academic_ability_test: {
    description: String,
    score_standards: {
      type: Map,
      of: ScoreStandardSchema,
    },
  },
  english_listening: {
    description: String,
    levels: [String],
  },
}, { _id: false });

const AdmissionPlanSchema = new Schema({
  quota: Number,
  exam_thresholds: [ExamThresholdSchema],
  selection_multipliers: [SelectionMultiplierSchema],
  scoring_weights: [ScoringWeightSchema],
  tie_breakers: [String],
  english_listening_threshold: String,
  art_test_category: String,
  last_year_pass_data: {
    academic_year: Number,
    passing_sequence: [{
      subject: String,
      grade: Number,
      note: String
    }]
  },
  ranking_criteria: [{
    item: String,
    percentile: Number
  }]
}, { _id: false });

// --- Department Schema (Embedded) ---

const DepartmentSchema = new Schema({
  department_id: { type: String, required: true },
  department_name: { type: String, required: true },
  college: { type: String, required: true },
  academic_group: { type: String, required: true }, // New: academic group classification
  campus_ids: [{ type: String }], // Reference to School.campuses.campus_id
  department_description: { type: String },
  years_of_study: { type: Number },
  admission_data: {
    type: Map,
    of: new Schema({
      plans: {
        personal_application: AdmissionPlanSchema,
        distribution_admission: AdmissionPlanSchema,
        star_plan: AdmissionPlanSchema,
      },
      assessment_standards: AssessmentStandardsSchema,
    }, { _id: false }),
  },
}, { _id: false }); // _id is false if we don't need direct ID access, but usually good to have. User didn't specify. I'll keep it false to match JSON structure cleanly or true if needed. JSON has department_id.

// --- School Schema ---

export interface ICampus {
  campus_id: string;
  campus_name: string;
  is_main: boolean;
  location: {
    city: string;
    district: string;
    address: string;
    google_map_url?: string;
  };
}

export interface ISchool extends Document {
  school_id: string;
  school_name: string;
  school_type: string;
  school_images: string[];
  school_url: string;
  campuses: ICampus[];
  departments: any[]; // Typed as any for now to avoid complex Interface duplication, or I should define IDepartment interface.
}

const CampusSchema = new Schema<ICampus>({
  campus_id: { type: String, required: true },
  campus_name: { type: String, required: true },
  is_main: { type: Boolean, default: false },
  location: {
    city: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    google_map_url: { type: String },
  },
}, { _id: false });

const SchoolSchema = new Schema<ISchool>({
  school_id: { type: String, required: true, unique: true },
  school_name: { type: String, required: true },
  school_type: { type: String, required: true },
  school_images: [{ type: String }],
  school_url: { type: String },
  campuses: [CampusSchema],
  departments: [DepartmentSchema],
}, { timestamps: true });

const School: Model<ISchool> = mongoose.models.School || mongoose.model<ISchool>('School', SchoolSchema);

export default School;
