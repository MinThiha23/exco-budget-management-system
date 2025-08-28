import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Program } from '../../types';

interface SubmitConfirmationModalProps {
  program: Program;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const SubmitConfirmationModal: React.FC<SubmitConfirmationModalProps> = ({
  program,
  onClose,
  onConfirm,
  isSubmitting
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Submit Program for Review
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to submit the program <strong>'{program.title}'</strong> for review?
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-2">This will:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Change the program status to 'Under Review'</li>
                    <li>• Send the program to Finance for approval</li>
                    <li>• Lock the program from further editing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit for Review</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmationModal;
