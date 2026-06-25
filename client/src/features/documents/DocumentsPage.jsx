import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice';
import {
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useVerifyDocumentMutation
} from '../../services/api';
import { FileText, Upload, CheckCircle, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FileUpload from '../../components/ui/FileUpload';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docType, setDocType] = useState('Resume');

  // Verify modal states
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejReason, setRejReason] = useState('');

  const { data: docsData, isLoading, refetch } = useGetDocumentsQuery();
  const [uploadDocApi, { isLoading: uploadLoading }] = useUploadDocumentMutation();
  const [verifyDocApi, { isLoading: verifyLoading }] = useVerifyDocumentMutation();

  const handleUploadSubmit = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', docType);

    try {
      await uploadDocApi(formData).unwrap();
      toast.success('Document uploaded successfully!');
      setIsUploadOpen(false);
      refetch();
    } catch (err) {
      toast.error('Document upload failed.');
    }
  };

  const handleVerifySubmit = async (status) => {
    if (status === 'Rejected' && !rejReason) {
      return toast.error('Please input a rejection reason');
    }

    try {
      await verifyDocApi({
        id: selectedDoc._id,
        status,
        rejectedReason: status === 'Rejected' ? rejReason : undefined,
      }).unwrap();

      toast.success(`Document marked as ${status.toLowerCase()}!`);
      setIsVerifyOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to update verification status.');
    }
  };

  const triggerVerify = (doc) => {
    setSelectedDoc(doc);
    setRejReason('');
    setIsVerifyOpen(true);
  };

  const formatDateStr = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const docTypes = [
    'Resume',
    'Aadhaar',
    'PAN',
    'Offer Letter',
    'Experience Letter',
    'Education Certificate',
    'Bank Passbook'
  ];

  const columns = [
    { header: 'Employee ID', render: (row) => <span className="font-mono text-xs">{row.employee?.employeeId}</span> },
    { header: 'Employee Name', render: (row) => <span className="font-semibold">{row.employee?.fullName}</span> },
    { header: 'Doc Type', key: 'type' },
    { header: 'Filename', key: 'name' },
    { header: 'Date Uploaded', render: (row) => formatDateStr(row.createdAt) },
    {
      header: 'Verification Status',
      render: (row) => (
        <Badge variant={row.verificationStatus === 'Verified' ? 'success' : row.verificationStatus === 'Pending' ? 'warning' : 'danger'}>
          {row.verificationStatus}
        </Badge>
      )
    },
    {
      header: 'Review Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <a
            href={row.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 hover:bg-white/5 rounded text-accent-primary"
            title="Download / View document"
          >
            <ExternalLink className="h-4.5 w-4.5" />
          </a>
          {user?.role !== 'Employee' && row.verificationStatus === 'Pending' && (
            <Button
              onClick={() => triggerVerify(row)}
              variant="ghost"
              size="sm"
              className="text-xs text-accent-secondary"
              icon={Eye}
            >
              Verify
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Documents Folder</h1>
          <p className="text-sm text-text-secondary font-medium">Upload government credentials, resume profiles, and contract sheets</p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          variant="primary"
          icon={Upload}
          className="font-semibold"
        >
          Upload Document
        </Button>
      </div>

      {/* Grid of details / tables */}
      <div className="grid grid-cols-1 gap-6">
        <Card hover={false} className="border border-white/5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold border-b border-white/5 pb-2 text-text-primary">Corporate Document Database</h3>
          <Table
            columns={columns}
            data={docsData?.data || []}
            loading={isLoading}
          />
        </Card>
      </div>

      {/* Upload File Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Document Attachment">
        <div className="space-y-4 py-1">
          <Select
            label="Document Classification Type *"
            options={docTypes.map(t => ({ label: t, value: t }))}
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          />

          <FileUpload onUpload={handleUploadSubmit} loading={uploadLoading} />
        </div>
      </Modal>

      {/* HR Verify Document Modal */}
      <Modal isOpen={isVerifyOpen} onClose={() => setIsVerifyOpen(false)} title="Document Verification Review">
        {selectedDoc && (
          <div className="space-y-4">
            <div className="text-xs text-text-secondary leading-relaxed p-3.5 rounded-lg border border-white/5 bg-white/[0.01]">
              <div><span className="text-text-muted">Staff Name:</span> <span className="font-semibold text-text-primary">{selectedDoc.employee?.fullName}</span></div>
              <div><span className="text-text-muted">Type:</span> <span className="font-semibold text-text-primary">{selectedDoc.type}</span></div>
              <div><span className="text-text-muted">Filename:</span> <span className="font-semibold text-text-primary">{selectedDoc.name}</span></div>
              <a
                href={selectedDoc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-accent-primary hover:underline flex items-center gap-1 font-semibold"
              >
                View Attachment File <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Input
              label="Rejection Comments (Required only if rejecting)"
              placeholder="e.g. Image resolution is blurry, please re-upload clear copy"
              value={rejReason}
              onChange={(e) => setRejReason(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-2">
              <Button type="button" variant="ghost" onClick={() => setIsVerifyOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleVerifySubmit('Rejected')}
                loading={verifyLoading}
                variant="danger"
              >
                Reject File
              </Button>
              <Button
                onClick={() => handleVerifySubmit('Verified')}
                loading={verifyLoading}
                variant="primary"
                className="font-semibold"
              >
                Verify & Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentsPage;
