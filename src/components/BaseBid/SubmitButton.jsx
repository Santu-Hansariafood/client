import Buttons from "../../common/Buttons/Buttons";

const SubmitButton = ({ isSubmitting, handleSubmit }) => {
  return (
    <div className="mt-6 text-center">
      <Buttons
        label={isSubmitting ? "Submitting..." : "Submit Bid"}
        onClick={handleSubmit}
        type="button"
        variant="primary"
        size="md"
        disabled={isSubmitting}
      />
    </div>
  );
};

export default SubmitButton;
