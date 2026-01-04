import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';

const AddEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('events')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            event_date: formData.event_date
          }
        ]);

      if (error) throw error;

      toast.success("Event Published Successfully! 📢");
      navigate('/admin/dashboard'); 

    } catch (error: any) {
      console.error(error);
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-6 text-center">📢 Add New Notice</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Holi Holiday"
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-gray-700">Event Date</label>
            <input
              type="date"
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700">Description</label>
            <textarea
              required
              rows={4}
              placeholder="Write full details here..."
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold shadow disabled:opacity-50"
          >
            {loading ? 'Publishing...' : '📢 Publish Notice'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 font-bold"
          >
            Cancel
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddEvent;
