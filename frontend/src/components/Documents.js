import React, { useState, useEffect } from 'react';
import { documentsService } from '../services/api';
import { toast } from 'sonner';
import { formatDate } from '../utils/helpers';

const Documents = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = ['General', 'Contract', 'Payslip', 'Certificate', 'Policy', 'Personal', 'Other'];

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsService.getAll();
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);

      await documentsService.upload(formData);
      toast.success('Document uploaded successfully!');
      loadDocuments();
      e.target.value = ''; // Reset file input
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await documentsService.delete(id);
      toast.success('Document deleted successfully!');
      loadDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = (doc) => {
    // For base64 encoded files
    if (doc.file_url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.file_name;
      link.click();
    } else {
      // For S3 URLs
      window.open(doc.file_url, '_blank');
    }
  };

  // Filtering
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return '📊';
    return '📎';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'General': 'bg-gray-100 text-gray-800',
      'Contract': 'bg-blue-100 text-blue-800',
      'Payslip': 'bg-green-100 text-green-800',
      'Certificate': 'bg-purple-100 text-purple-800',
      'Policy': 'bg-yellow-100 text-yellow-800',
      'Personal': 'bg-pink-100 text-pink-800',
      'Other': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || colors['Other'];
  };

  if (loading) {
    return <div className="skeleton h-64"></div>;
  }

  return (
    <div className="space-y-6 fade-in" data-testid="documents-page">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold">Document Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-input rounded-md bg-background"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <label className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 cursor-pointer flex items-center justify-center gap-2">
            {uploading ? (
              <>
                <span className="animate-spin">⏳</span>
                Uploading...
              </>
            ) : (
              <>
                <span>📤</span>
                Upload Document
              </>
            )}
            <input
              type="file"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              data-testid="upload-document-input"
            />
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Total Documents</p>
          <p className="text-2xl font-bold">{documents.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Contracts</p>
          <p className="text-2xl font-bold text-blue-600">{documents.filter(d => d.category === 'Contract').length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Payslips</p>
          <p className="text-2xl font-bold text-green-600">{documents.filter(d => d.category === 'Payslip').length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Certificates</p>
          <p className="text-2xl font-bold text-purple-600">{documents.filter(d => d.category === 'Certificate').length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold mb-1 block">Search</label>
            <input
              type="text"
              placeholder="Search by file name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h3 className="text-xl font-semibold">My Documents</h3>
          <p className="text-sm text-muted-foreground">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
        </div>
        {paginatedDocuments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">File Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Uploaded By</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocuments.map((doc, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">{doc.file_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(doc.category)}`}>
                          {doc.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm">{doc.full_name || 'N/A'}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm">{formatDate(doc.uploaded_at)}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            📥 Download
                          </button>
                          {['Admin', 'Director', 'HR'].includes(user.role) && (
                            <button
                              onClick={() => handleDelete(doc.id, doc.file_name)}
                              className="text-red-600 hover:underline text-sm flex items-center gap-1"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDocuments.length)} of {filteredDocuments.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm mt-2">Upload your first document to get started</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span>💡</span>
          Document Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Supported Files:</p>
            <p>PDF, DOC, DOCX, JPG, PNG, GIF</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Maximum Size:</p>
            <p>10MB per file</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Categories:</p>
            <p>Organize files using categories for easy access</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Storage:</p>
            <p>Documents are securely stored and accessible anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
