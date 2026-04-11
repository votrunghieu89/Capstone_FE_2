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
  public async getTechnicianStats(technicianId: string): Promise<TechnicianStats> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/dashboard-summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching technician stats:', error);
      return {
        totalOrders: 0,
        completedOrders: 0,
        totalEarnings: 0,
        averageRating: 0,
        earningsByMonth: [],
        recentActivities: [],
      };
    }
  }
}

export const statisticService = new StatisticService();
