import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/UI/DataTable';
import Pagination from '../../components/UI/Pagination';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import PermissionGate from '../../components/Guard/PermissionGate';
import Modal from '../../components/UI/Modal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Truck {
  id: string;
  plateNumber: string;
  driverName: string;
  customerId: string;
  customerName: string;
  maxCapacityKg: number;
  isActive: boolean;
}

interface CustomerLookup {
  id: string;
  name: string;
}

export const Trucks = () => {
  const [data, setData] = useState<Truck[]>([]);
  const [customers, setCustomers] = useState<CustomerLookup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: '', title: '' });
  const [modalState, setModalState] = useState({ isOpen: false, isEdit: false, id: '' });
  const [formData, setFormData] = useState({ plateNumber: '', driverName: '', customerId: '', maxCapacityKg: 0, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/customers', { params: { PageSize: 100 } });
      if (response.data.success) {
        setCustomers(response.data.data.items);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/trucks', {
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
      console.error('Error fetching trucks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, pageSize]);

  useEffect(() => {
    fetchData();
    fetchCustomers();
  }, [fetchData, fetchCustomers]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/trucks/${deleteDialog.id}`);
      setDeleteDialog({ isOpen: false, id: '', title: '' });
      fetchData();
    } catch (error) {
      console.error('Error deleting truck:', error);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ plateNumber: '', driverName: '', customerId: '', maxCapacityKg: 0, isActive: true });
    setModalState({ isOpen: true, isEdit: false, id: '' });
  };

  const handleOpenEdit = (row: Truck) => {
    setFormData({ 
      plateNumber: row.plateNumber, 
      driverName: row.driverName, 
      customerId: row.customerId, 
      maxCapacityKg: row.maxCapacityKg, 
      isActive: row.isActive 
    });
    setModalState({ isOpen: true, isEdit: true, id: row.id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalState.isEdit) {
        await axiosInstance.put(`/trucks/${modalState.id}`, formData);
      } else {
        await axiosInstance.post('/trucks', { 
          plateNumber: formData.plateNumber, 
          driverName: formData.driverName, 
          customerId: formData.customerId, 
          maxCapacityKg: formData.maxCapacityKg 
        });
      }
      setModalState({ isOpen: false, isEdit: false, id: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error saving truck:', error);
      let errorMessage = 'Terjadi kesalahan saat menyimpan truck.';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const errors = error.response.data.errors;
          if (Array.isArray(errors)) {
            errorMessage = errors.join('\n');
          } else if (typeof errors === 'object') {
            errorMessage = Object.values(errors).flat().join('\n');
          }
        }
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: 'No. Polisi', accessor: 'plateNumber' as keyof Truck },
    { header: 'Sopir', accessor: 'driverName' as keyof Truck },
    { header: 'Perusahaan / Customer', accessor: 'customerName' as keyof Truck },
    { header: 'Kapasitas Maksimal (kg)', accessor: 'maxCapacityKg' as keyof Truck },
    {
      header: 'Status',
      accessor: (row: Truck) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      header: 'Aksi',
      accessor: (row: Truck) => (
        <div className="flex space-x-2">
          <PermissionGate permission="truck.update">
            <button className="text-blue-600 hover:text-blue-900" title="Edit" onClick={() => handleOpenEdit(row)}>
              <Edit2 size={18} />
            </button>
          </PermissionGate>
          <PermissionGate permission="truck.delete">
            <button 
              className="text-red-600 hover:text-red-900" 
              title="Delete"
              onClick={() => setDeleteDialog({ isOpen: true, id: row.id, title: row.plateNumber })}
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
        <h1 className="text-2xl font-bold text-gray-900">Master Truck</h1>
        <PermissionGate permission="truck.create">
          <button onClick={handleOpenAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Tambah Truck</span>
          </button>
        </PermissionGate>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Cari truck..."
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
        title={modalState.isEdit ? "Edit Truck" : "Tambah Truck"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900">Plat Nomor (No. Polisi)</label>
            <input 
              type="text" 
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
              value={formData.plateNumber}
              onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900">Nama Sopir</label>
            <input 
              type="text" 
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
              value={formData.driverName}
              onChange={(e) => setFormData({...formData, driverName: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900">Customer (Pemilik)</label>
            <select 
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              value={formData.customerId}
              onChange={(e) => setFormData({...formData, customerId: e.target.value})}
            >
              <option value="">-- Pilih Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900">Kapasitas Maksimal (kg)</label>
            <input 
              type="number" 
              required
              min="0"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
              value={formData.maxCapacityKg}
              onChange={(e) => setFormData({...formData, maxCapacityKg: Number(e.target.value)})}
            />
          </div>
          {modalState.isEdit && (
            <div className="flex items-center">
              <input 
                id="isActiveTruck" 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <label htmlFor="isActiveTruck" className="ms-2 text-sm font-medium text-gray-900">Aktif</label>
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
        title="Hapus Truck"
        message={`Apakah Anda yakin ingin menghapus truck "${deleteDialog.title}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: '', title: '' })}
      />
    </div>
  );
};
