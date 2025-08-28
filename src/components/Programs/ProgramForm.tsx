import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Program } from '../../types';
import { usePrograms } from '../../contexts/ProgramContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config/api';

interface ProgramFormProps {
  program?: Program;
  onClose: () => void;
  onSave: (program?: Partial<Program>) => void;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ program, onClose, onSave }) => {
  const { addProgram } = usePrograms();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: program?.title || '',
    description: program?.description || '',
    department: program?.department || user?.department || '',
    recipientName: program?.recipientName || '',
    submittedBy: program?.submittedBy || user?.name || '',
    budget: program?.budget || 0,
    startDate: program?.startDate || '',
    endDate: program?.endDate || '',
    letterReferenceNumber: program?.letterReferenceNumber || '',
    documents: program?.documents || [],
    objectives: program?.objectives || [],
    kpi: program?.kpi || []
  });

  // State for additional document title input
  const [additionalDocTitle, setAdditionalDocTitle] = useState('');
  const [showAdditionalDocInput, setShowAdditionalDocInput] = useState(false);

  const requiredDocLabels = [
    'Surat Akuan Pusat Khidmat',
    'Surat Kelulusan Pkn',
    'Surat Program',
    'Surat Exco',
    'Penyata Akaun Bank',
    'Borang Daftar Kod'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) || 0 : value
    }));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData(prev => ({ ...prev, objectives: newObjectives }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const removeObjective = (index: number) => {
    if (formData.objectives.length > 1) {
      const newObjectives = formData.objectives.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, objectives: newObjectives }));
    }
  };

  const handleKpiChange = (index: number, value: string) => {
    const newKpi = [...formData.kpi];
    newKpi[index] = value;
    setFormData(prev => ({ ...prev, kpi: newKpi }));
  };

  const addKpi = () => {
    setFormData(prev => ({
      ...prev,
      kpi: [...prev.kpi, '']
    }));
  };

  const removeKpi = (index: number) => {
    if (formData.kpi.length > 1) {
      const newKpi = formData.kpi.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, kpi: newKpi }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('documents[]', file);
      });

      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const fileData = data.files.map((file: any) => ({ ...file.fullData, category }));
        console.log('File upload successful, fileData:', fileData);
        setFormData(prev => {
          const newFormData = {
            ...prev,
            documents: [...prev.documents, ...fileData]
          };
          console.log('Updated formData documents:', newFormData.documents);
          return newFormData;
        });
      } else {
        console.error('Upload failed:', data.error);
        alert('File upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed. Please try again.');
    }
  };

  const removeDocument = (index: number) => {
    const newDocuments = formData.documents.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, documents: newDocuments }));
  };

  const handleAdditionalDocumentUpload = async (files: FileList) => {
    if (!additionalDocTitle.trim()) {
      alert('Please enter a title for the document');
      return;
    }

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('documents[]', file);
      });

      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const fileData = data.files.map((file: any) => ({ ...file.fullData, category: additionalDocTitle }));
        console.log('Additional document upload successful, fileData:', fileData);
        setFormData(prev => {
          const newFormData = {
            ...prev,
            documents: [...prev.documents, ...fileData]
          };
          console.log('Updated formData documents:', newFormData.documents);
          return newFormData;
        });
        
        // Reset the additional document input
        setAdditionalDocTitle('');
        setShowAdditionalDocInput(false);
      } else {
        console.error('Upload failed:', data.error);
        alert('File upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('File upload failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Form submission - formData documents:', formData.documents);
    console.log('Form submission - formData:', formData);

    try {
      // Validate required fields
      if (!formData.letterReferenceNumber.trim()) {
        alert('Please provide Letter Reference Number');
        setIsLoading(false);
        return;
      }
      if (program) {
        // Edit existing program
        await onSave(formData);
      } else {
        // Create new program
        const newProgram = {
          ...formData,
          status: 'draft' as Program['status'],
          userId: user?.id || ''
        };
        console.log('Creating program with documents:', newProgram.documents);
        console.log('Creating program with full data:', newProgram);
        await addProgram(newProgram);
        onSave();
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error saving program. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {program ? 'Edit Program' : 'Create New Program'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Status Indicator for Editing Submitted Programs */}
          {program && program.status !== 'draft' && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-800">
                    <strong>Editing Submitted Program:</strong> This program has been submitted to finance. 
                    You can still edit it, but changes will be tracked and finance will be notified.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submitted By *
                  </label>
                  <input
                    type="text"
                    name="submittedBy"
                    value={formData.submittedBy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (RM) *
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Letter Reference Number *
                  </label>
                  <input
                    type="text"
                    name="letterReferenceNumber"
                    value={formData.letterReferenceNumber}
                    onChange={handleInputChange}
                    placeholder="Enter letter reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Objectives */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Objectives (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">You can add program objectives to help define the goals and outcomes of your program.</p>
              {formData.objectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                    placeholder={`Objective ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {formData.objectives.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-2">No objectives added yet</p>
                  <button
                    type="button"
                    onClick={addObjective}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add First Objective
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={addObjective}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Objective
                </button>
              )}
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">PDF, DOC, DOCX, XLS, XLSX up to 10MB. Documents are completely optional - you can create programs without uploading any files.</p>
              <div className="space-y-3">
                {requiredDocLabels.map((label) => (
                  <div key={label} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="text-sm font-medium text-gray-700">{label} (Optional)</div>
                    <div className="md:col-span-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => handleFileUpload(e, label)}
                        className="block w-full text-sm text-gray-700"
                      />
                      {/* Show selected file for this category, if any */}
                      {formData.documents.some((d: any) => (typeof d === 'object' ? d.category : undefined) === label) ? (
                        <div className="mt-1 text-xs text-gray-600">
                          {(formData.documents.find((d: any) => (typeof d === 'object' ? d.category : undefined) === label) as any)?.originalName}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-gray-500">No file chosen</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add More Documents */}
              <div className="mt-4">
                {!showAdditionalDocInput ? (
                  <button
                    type="button"
                    onClick={() => setShowAdditionalDocInput(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <span>+</span>
                    <span>Add More Document</span>
                  </button>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Title *
                      </label>
                      <input
                        type="text"
                        value={additionalDocTitle}
                        onChange={(e) => setAdditionalDocTitle(e.target.value)}
                        placeholder="Enter document title (e.g., Meeting Minutes, Budget Report, etc.)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose File
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleAdditionalDocumentUpload(e.target.files);
                          }
                        }}
                        className="block w-full text-sm text-gray-700"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdditionalDocInput(false);
                          setAdditionalDocTitle('');
                        }}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {formData.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">
                        {typeof doc === 'string' ? doc : `${doc.originalName}${doc.category ? ` (${doc.category})` : ''}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KPIs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">You can add KPIs to measure the success and impact of your program.</p>
              {formData.kpi.map((kpi, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={kpi}
                    onChange={(e) => handleKpiChange(index, e.target.value)}
                    placeholder="e.g., Children supported: 190"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.kpi.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKpi(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {formData.kpi.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-2">No KPIs added yet</p>
                  <button
                    type="button"
                    onClick={addKpi}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add First KPI
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={addKpi}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add KPI
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : (program ? 'Update Program' : 'Create Program')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramForm;