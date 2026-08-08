import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/UI/DataTable';
import Pagination from '../../components/UI/Pagination';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import PermissionGate from '../../components/Guard/PermissionGate';
import Modal from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { StatusBadge } from '../../components/UI/StatusBadge';

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
        <StatusBadge 
          status={row.isActive ? 'ready' : 'error'} 
          label={row.isActive ? 'Aktif' : 'Nonaktif'} 
        />
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: MaterialType) => (
        <div className="flex space-x-3">
          <PermissionGate permission="material.update">
            <button className="text-gray-500 hover:text-safety-amber dark:text-gray-400 dark:hover:text-safety-amber transition-colors" title="Edit" onClick={() => handleOpenEdit(row)}>
              <Edit2 size={18} />
            </button>
          </PermissionGate>
          <PermissionGate permission="material.delete">
            <button 
              className="text-gray-500 hover:text-alert-red dark:text-gray-400 dark:hover:text-alert-red transition-colors" 
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
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-steel-100">Master Material</h1>
        <PermissionGate permission="material.create">
          <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-safety-amber text-steel-900 px-4 py-2 rounded-md hover:bg-yellow-500 transition-colors font-display tracking-wide uppercase text-sm font-semibold">
            <Plus size={20} />
            <span>Tambah Material</span>
          </button>
        </PermissionGate>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-steel-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-steel-900">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Cari material..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-steel-900 bg-gray-50 dark:bg-steel-900 text-gray-900 dark:text-steel-100 rounded-md focus:ring-safety-amber focus:border-safety-amber transition-colors"
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
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-steel-100">Nama Material</label>
            <input 
              type="text" 
              required
              className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-800 text-gray-900 dark:text-steel-100 text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-steel-100">Satuan (Unit)</label>
            <input 
              type="text" 
              required
              className="bg-gray-50 dark:bg-steel-900 border border-gray-300 dark:border-steel-800 text-gray-900 dark:text-steel-100 text-sm rounded-lg focus:ring-safety-amber focus:border-safety-amber block w-full p-2.5" 
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
          </div>
          {modalState.isEdit && (
            <div className="flex items-center">
              <input 
                id="isActive" 
                type="checkbox" 
                className="w-4 h-4 text-safety-amber bg-gray-100 dark:bg-steel-900 border-gray-300 dark:border-steel-800 rounded focus:ring-safety-amber"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <label htmlFor="isActive" className="ms-2 text-sm font-medium text-gray-900 dark:text-steel-100">Aktif</label>
            </div>
          )}
          <div className="flex justify-end pt-4 space-x-2">
            <button 
              type="button" 
              className="font-display tracking-wide uppercase text-sm font-semibold py-2.5 px-5 text-gray-900 dark:text-steel-100 bg-white dark:bg-steel-800 rounded-lg border border-gray-200 dark:border-steel-900 hover:bg-gray-100 dark:hover:bg-steel-900"
              onClick={() => setModalState({ ...modalState, isOpen: false })}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="font-display tracking-wide uppercase text-sm font-semibold text-steel-900 bg-safety-amber hover:bg-yellow-500 rounded-lg px-5 py-2.5 focus:outline-none disabled:opacity-50 transition-colors"
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
