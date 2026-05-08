import api from './api';

export interface CompletedInvoiceOrder {
  orderId: string;
  customerId?: string;
  technicianID?: string;
  title?: string;
  status?: string;
  createdAt?: string;
}

export interface BankOption {
  bankName: string;
  bankCode: string;
}

export interface CreateInvoicePayload {
  orderId: string;
  laborCost: number;
  bankCode?: string;
  bankAccount?: string;
  bankAccountName?: string;
  materials: Array<{
    materialName: string;
    price: number;
    quantity: number;
  }>;
}

export interface InvoiceDetail {
  invoiceId: string;
  nameCustomer?: string;
  nameTechnician?: string;
  serviceName?: string;
  adressOrder?: string;
  cityNameOrder?: string;
  customerPhone?: string;
  materials: Array<{
    materialName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  laborCost: number;
  totalAmount: number;
  qrCode?: string;
  paymentStatus: number;
  createdAt?: string;
}

export interface InvoiceUpdateInfo {
  orderId: string;
  invoiceId: string;
  laborCost: number;
  totalAmount: number;
  bankCode?: string;
  bankAccount?: string;
  bankAccountName?: string;
  createdAt?: string;
  materials: Array<{
    materialName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

const unwrap = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.value)) return payload.value;
  return [];
};

const normalizeOrder = (order: any): CompletedInvoiceOrder => ({
  orderId: String(order?.orderId || order?.OrderId || ''),
  customerId: order?.customerId || order?.CustomerId,
  technicianID: order?.technicianID || order?.TechnicianID || order?.technicianId || order?.TechnicianId,
  title: order?.title || order?.Title || 'Đơn đã hoàn thành',
  status: order?.status || order?.Status || 'Completed',
  createdAt: order?.createdAt || order?.CreatedAt,
});

const normalizeInvoiceDetail = (detail: any): InvoiceDetail => ({
  invoiceId: String(detail?.invoiceId || detail?.InvoiceId || ''),
  nameCustomer: detail?.nameCustomer || detail?.NameCustomer,
  nameTechnician: detail?.nameTechnician || detail?.NameTechnician,
  serviceName: detail?.serviceName || detail?.ServiceName,
  adressOrder: detail?.adressOrder || detail?.AdressOrder || detail?.addressOrder || detail?.AddressOrder,
  cityNameOrder: detail?.cityNameOrder || detail?.CityNameOrder,
  customerPhone: detail?.customerPhone || detail?.CustomerPhone,
  materials: unwrap(detail?.materials || detail?.Materials).map((material: any) => ({
    materialName: material?.materialName || material?.MaterialName || '',
    price: Number(material?.price || material?.Price || 0),
    quantity: Number(material?.quantity || material?.Quantity || 0),
    subtotal: Number(material?.subtotal || material?.Subtotal || 0),
  })),
  laborCost: Number(detail?.laborCost || detail?.LaborCost || 0),
  totalAmount: Number(detail?.totalAmount || detail?.TotalAmount || 0),
  qrCode: detail?.qrCode || detail?.QRCode,
  paymentStatus: Number(detail?.paymentStatus ?? detail?.PaymentStatus ?? 0),
  createdAt: detail?.createdAt || detail?.CreatedAt,
});

const normalizeInvoiceUpdateInfo = (detail: any): InvoiceUpdateInfo => ({
  orderId: String(detail?.orderId || detail?.OrderId || ''),
  invoiceId: String(detail?.invoiceId || detail?.InvoiceId || ''),
  laborCost: Number(detail?.laborCost || detail?.LaborCost || 0),
  totalAmount: Number(detail?.totalAmount || detail?.TotalAmount || 0),
  bankCode: detail?.bankCode || detail?.BankCode || '',
  bankAccount: detail?.bankAccount || detail?.BankAccount || '',
  bankAccountName: detail?.bankAccountName || detail?.BankAccountName || '',
  createdAt: detail?.createdAt || detail?.CreatedAt,
  materials: unwrap(detail?.materials || detail?.Materials).map((material: any) => ({
    materialName: material?.materialName || material?.MaterialName || '',
    price: Number(material?.price || material?.Price || 0),
    quantity: Number(material?.quantity || material?.Quantity || 0),
    subtotal: Number(material?.subtotal || material?.Subtotal || 0),
  })),
});

const invoiceService = {
  getTechnicianCompletedOrders: async (technicianId: string): Promise<CompletedInvoiceOrder[]> => {
    const res = await api.get(`/Invoice/technician/${technicianId}/completed-orders`);
    return unwrap(res.data).map(normalizeOrder).filter((order: CompletedInvoiceOrder) => order.orderId);
  },

  checkInvoice: async (orderId: string) => {
    const res = await api.get(`/Invoice/check-invoice/${orderId}`);
    return Boolean(res.data);
  },

  getBanks: async (): Promise<BankOption[]> => {
    const res = await api.get('/Invoice/banks');
    return unwrap(res.data)
      .map((bank: any) => ({
        bankName: bank?.bankName || bank?.BankName || '',
        bankCode: bank?.bankCode || bank?.BankCode || '',
      }))
      .filter((bank: BankOption) => bank.bankName && bank.bankCode);
  },

  createInvoice: async (payload: CreateInvoicePayload) => {
    const res = await api.post('/Invoice/create', {
      OrderId: payload.orderId,
      LaborCost: payload.laborCost,
      BankCode: payload.bankCode,
      BankAccount: payload.bankAccount,
      BankAccountName: payload.bankAccountName,
      Materials: payload.materials.map((material) => ({
        MaterialName: material.materialName,
        Price: material.price,
        Quantity: material.quantity,
      })),
    });
    return res.data;
  },

  getInvoiceUpdateInfo: async (orderId: string): Promise<InvoiceUpdateInfo> => {
    const res = await api.get(`/Invoice/update-info/${orderId}`);
    return normalizeInvoiceUpdateInfo(res.data);
  },

  updateInvoice: async (orderId: string, payload: CreateInvoicePayload) => {
    const res = await api.put(`/Invoice/update/${orderId}`, {
      OrderId: orderId,
      LaborCost: payload.laborCost,
      BankCode: payload.bankCode,
      BankAccount: payload.bankAccount,
      BankAccountName: payload.bankAccountName,
      Materials: payload.materials.map((material) => ({
        MaterialName: material.materialName,
        Price: material.price,
        Quantity: material.quantity,
      })),
    });
    return res.data;
  },

  getInvoiceDetail: async (orderId: string): Promise<InvoiceDetail> => {
    const res = await api.get(`/Invoice/detail/${orderId}`);
    return normalizeInvoiceDetail(res.data);
  },

  isPayment: async (invoiceId: string) => {
    const res = await api.get(`/Invoice/is-payment/${invoiceId}`);
    return Boolean(res.data);
  },

  confirmPayment: async (invoiceId: string) => {
    const res = await api.put(`/Invoice/confirm-payment/${invoiceId}`);
    return res.data;
  },

  deleteInvoice: async (invoiceId: string) => {
    const res = await api.delete(`/Invoice/delete/${invoiceId}`);
    return res.data;
  },
};

export default invoiceService;
