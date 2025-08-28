import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, Building, MapPin, FileText, User as UserIcon, Target, Eye, Heart, Users } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

interface ExcoUser {
  id: number;
  name: string;
  title: string;
  role: string;
  image_url: string;
  email: string;
  phone: string;
  department: string;
  position: string;
}

interface Program {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  voucher_number?: string;
  eft_number?: string;
  letter_reference_number?: string;
}

interface ExcoUserProfileProps {
  user: ExcoUser;
  onBack: () => void;
  viewMode: 'directory' | 'portfolio' | 'pusat-khidmat';
}

const ExcoUserProfile: React.FC<ExcoUserProfileProps> = ({ user, onBack, viewMode }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'programs'>('profile');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (viewMode === 'portfolio' && activeTab === 'programs') {
      fetchUserPrograms();
    }
  }, [activeTab, user.id, viewMode]);

  const fetchUserPrograms = async () => {
    setLoading(true);
    try {
      // Find the user in the users table by email to get their user ID
      const authUserRaw = localStorage.getItem('authUser');
      const viewerId = authUserRaw ? JSON.parse(authUserRaw).id : undefined;
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=getUserProgramsByEmail&email=${encodeURIComponent(user.email)}${viewerId ? `&viewer_id=${viewerId}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error('Error fetching user programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'queried': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Pusat Khidmat View
  if (viewMode === 'pusat-khidmat') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <button className="flex items-center text-blue-600 hover:text-blue-800 font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
            </div>
            <div className="text-center mt-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Service Center {user.name}
              </h1>
              <p className="text-lg text-gray-600">{user.title}</p>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              
              {/* Left Column - Profile & Contact Information */}
              <div className="p-8 bg-gray-50">
                {/* Profile Picture */}
                <div className="text-center mb-6">
                  <div className="w-32 h-32 mx-auto mb-4">
                    {user.image_url ? (
                      <img
                        src={user.image_url.startsWith('http') ? user.image_url : `/api/${user.image_url}`}
                        alt={user.name}
                        className="w-full h-full object-cover object-top rounded-full border-0"
                        style={{ 
                          objectPosition: 'center 20%',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full rounded-full border-0 bg-gray-200 flex items-center justify-center ${user.image_url ? 'hidden' : ''}`}
                      style={{ 
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                    >
                      <UserIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
                  <p className="text-gray-600">{user.title}</p>
                </div>

                {/* Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  
                  {user.email && (
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                    </div>
                  )}

                  {user.phone && (
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-gray-900">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Building className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-gray-900">
                        Pejabat Menteri Besar Kedah, Aras 4, Blok A, Wisma Darul Aman, 05503 Alor Setar, Kedah
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <p className="text-gray-900">www.kedah.gov.my</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Mission, Vision, Objectives, Programs */}
              <div className="p-8">
                <div className="space-y-6">
                  
                  {/* Mission Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Mission</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      To serve the people of Kedah with dedication, transparency, and excellence in governance, ensuring sustainable development and prosperity for all citizens while preserving our cultural heritage and natural environment.
                    </p>
                  </div>

                  {/* Vision Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Vision</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      To be a progressive, prosperous, and harmonious state that leads in sustainable development, innovation, and quality of life, while maintaining our Islamic values and multicultural identity.
                    </p>
                  </div>

                  {/* Objectives Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Objectives</h3>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Improve the standard of living for citizens.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Strengthen the state economy.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Preserve the environment.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Develop human capital.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Programs Section */}
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Programs</h3>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Kedah People's Assistance Program</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Rural Development Program</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Digital Education Program</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Portfolio View (existing profile and programs tabs)
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to EXCO Users Directory
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
          <p className="text-gray-600">{user.title}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Details
              </button>
              <button
                onClick={() => setActiveTab('programs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'programs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Programs
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Image */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center h-64">
                    {user.image_url ? (
                      <img
                        src={user.image_url.startsWith('http') ? user.image_url : `/api/${user.image_url}`}
                        alt={user.name}
                        className="w-full h-full object-cover object-top rounded-lg border-0"
                        style={{ 
                          objectPosition: 'center 20%',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                      />
                    ) : (
                      <UserIcon className="w-24 h-24 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Profile Information */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h2>
                      <p className="text-blue-600 font-medium">{user.title}</p>
                      <p className="text-gray-600 mt-2">{user.role}</p>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                      
                      {user.email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-gray-900">{user.email}</p>
                          </div>
                        </div>
                      )}

                      {user.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Telephone</p>
                            <p className="text-gray-900">{user.phone}</p>
                          </div>
                        </div>
                      )}

                      {user.department && (
                        <div className="flex items-center space-x-3">
                          <Building className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Department</p>
                            <p className="text-gray-900">{user.department}</p>
                          </div>
                        </div>
                      )}

                      {user.position && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Position</p>
                            <p className="text-gray-900">{user.position}</p>
                          </div>
                        </div>
                      )}

                      {/* Address */}
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <p className="text-gray-900">
                            Kedah State Legislative Assembly and Executive Council Office,<br />
                            Level 5, Block E, Wisma Darul Aman,<br />
                            05503 Alor Setar, Kedah Darul Aman
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Programs by {user.name}</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="ml-3 text-gray-600">Loading programs...</p>
                </div>
              ) : programs.length > 0 ? (
                <div className="space-y-4">
                  {programs.map((program) => (
                    <div key={program.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{program.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                          {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{program.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium">{formatDate(program.created_at)}</p>
                        </div>
                        {program.submitted_at && (
                          <div>
                            <p className="text-gray-500">Submitted</p>
                            <p className="font-medium">{formatDate(program.submitted_at)}</p>
                          </div>
                        )}
                        {program.approved_at && (
                          <div>
                            <p className="text-gray-500">Approved</p>
                            <p className="font-medium">{formatDate(program.approved_at)}</p>
                          </div>
                        )}
                        {program.rejected_at && (
                          <div>
                            <p className="text-gray-500">Rejected</p>
                            <p className="font-medium">{formatDate(program.rejected_at)}</p>
                          </div>
                        )}
                      </div>

                      {/* Additional Details */}
                      {(program.voucher_number || program.eft_number || program.letter_reference_number) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {program.voucher_number && (
                              <div>
                                <p className="text-gray-500">Voucher Number</p>
                                <p className="font-medium">{program.voucher_number}</p>
                              </div>
                            )}
                            {program.eft_number && (
                              <div>
                                <p className="text-gray-500">EFT Number</p>
                                <p className="font-medium">{program.eft_number}</p>
                              </div>
                            )}
                            {program.letter_reference_number && (
                              <div>
                                <p className="text-gray-500">Letter Reference</p>
                                <p className="font-medium">{program.letter_reference_number}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No programs found for this EXCO member.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcoUserProfile; 