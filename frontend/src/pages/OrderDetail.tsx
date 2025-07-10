import React from 'react';
import { useParams } from 'react-router-dom';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Detail</h1>
        <p className="text-gray-600">Order ID: {id}</p>
        <p className="text-gray-500 mt-4">This page is under construction</p>
      </div>
    </div>
  );
};

export default OrderDetail;
