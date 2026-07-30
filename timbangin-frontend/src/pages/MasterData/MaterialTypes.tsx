import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/UI/DataTable';
import Pagination from '../../components/UI/Pagination';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import PermissionGate from '../../components/Guard/PermissionGate';
import Modal from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface MaterialType {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
}

export const MaterialTypes = () => {
  const [data, setData] = useState<MaterialType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: '', title: '' });
  const [modalState, setModalState] = useState({ isOpen: false, isEdit: false, id: '' });
  const [formData, setFormData] = useState({ name: '', unit: '', isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/materialtypes', {
        params: {
          SearchTerm: searchTerm,
          PageNumber: page,
          PageSize: pageSize
        }
      });
      if (response.data.success) {
        setData(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching material types:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/materialtypes/${deleteDialog.id}`);
      setDeleteDialog({ isOpen: false, id: '', title: '' });
      fetchData();
    } catch (error) {
      console.error('Error deleting material type:', error);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', unit: '', isActive: true });
    setModalState({ isOpen: true, isEdit: false, id: '' });
  };

  const handleOpenEdit = (row: MaterialType) => {
    setFormData({ name: row.name, unit: row.unit, isActive: row.isActive });
    setModalState({ isOpen: true, isEdit: true, id: row.id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalState.isEdit) {
        await axiosInstance.put(`/materialtypes/${modalState.id}`, formData);
      } else {
        await axiosInstance.post('/materialtypes', { name: formData.name, unit: formData.unit });
      }
      setModalState({ isOpen: false, isEdit: false, id: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving material type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: 'Nama Material', accessor: 'name' as keyof MaterialType },
    { header: 'Satuan (Unit)', accessor: 'unit' as keyof MaterialType },
    {
      header: 'Status',
      accessor: (row: MaterialType) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: MaterialType) => (
        <div className="flex space-x-2">
          <PermissionGate permission="material.update">
            <button className="text-blue-600 hover:text-blue-900" title="Edit" onClick={() => handleOpenEdit(row)}>
              <Edit2 size={18} />
            </button>
          </PermissionGate>
          <PermissionGate permission="material.delete">
            <button 
              className="text-red-600 hover:text-red-900" 
              title="Delete"
              onClick={() => setDeleteDialog({ isOpen: true, id: row.id, title: row.name })}
            >
              <Trash2 size={18} />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Master Material</h1>
        <PermissionGate permission="material.create">
          <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Tambah Material</span>
          </button>
        </PermissionGate>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Cari material..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchData();
              }
            }}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <DataTable data={data} columns={columns} isLoading={isLoading} />
      
      {!isLoading && data.length > 0 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      <Modal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
        title={modalState.isEdit ? "Edit Material" : "Tambah Material"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900">Nama Material</label>
            <input 
              type="text" 
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900">Satuan (Unit)</label>
            <input 
              type="text" 
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
          </div>
          {modalState.isEdit && (
            <div className="flex items-center">
              <input 
                id="isActive" 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <label htmlFor="isActive" className="ms-2 text-sm font-medium text-gray-900">Aktif</label>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button 
              type="button" 
              className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700"
              onClick={() => setModalState({ ...modalState, isOpen: false })}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Material"
        message={`Apakah Anda yakin ingin menghapus material "${deleteDialog.title}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: '', title: '' })}
      />
    </div>
  );
};
