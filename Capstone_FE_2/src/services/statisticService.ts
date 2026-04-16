import api from './api';

export interface TechnicianStats {
  totalOrders: number;
  completedOrders: number;
  totalEarnings: number;
  averageRating: number;
  earningsByMonth: { label: string; value: number }[];
  recentActivities: { id: string; action: string; time: string }[];
}

class StatisticService {
  public async getTodayReceivedCount(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/received-today`);
      return response.data || 0;
    } catch (error) {
      console.error('Error fetching today requests:', error);
      return 0;
    }
  }

  public async getTotalCompletedCount(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/completed/total`);
      return response.data || 0;
    } catch (error) {
      console.error('Error fetching completed total:', error);
      return 0;
    }
  }

  public async getAverageRating(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/ratings/avg`);
      return response.data || 0;
    } catch (error) {
      console.error('Error fetching average rating:', error);
      return 0;
    }
  }

  public async getWeeklyPerformance(technicianId: string, from: string, to: string): Promise<any[]> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/completed-weekly`, {
        params: { from, to }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching weekly performance:', error);
      return [];
    }
  }

  public async getMonthlyPerformance(technicianId: string, year: number): Promise<any[]> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/completed-monthly`, {
        params: { year }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching monthly performance:', error);
      return [];
    }
  }

  public async getTotalOrders(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/total`);
      return response.data || 0;
    } catch (error) {
      console.error('Error fetching total orders:', error);
      return 0;
    }
  }
}

export const statisticService = new StatisticService();
