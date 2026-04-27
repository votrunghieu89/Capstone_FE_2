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
  /**
   * Lấy số lượng đơn hàng nhận được trong ngày hôm nay
   */
  public async getTodayReceivedCount(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/received-today`);
      return response.data || 0;
    } catch (error) {
      console.error('Lỗi khi lấy số lượng yêu cầu hôm nay:', error);
      return 0;
    }
  }

  /**
   * Lấy tổng số đơn hàng đã hoàn thành của kỹ thuật viên
   */
  public async getTotalCompletedCount(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/completed/total`);
      return response.data || 0;
    } catch (error) {
      console.error('Lỗi khi lấy tổng số đơn hoàn thành:', error);
      return 0;
    }
  }

  /**
   * Lấy số lượng đơn hàng hoàn thành trong ngày hôm nay
   */
  public async getTodayCompletedCount(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/completed-today`);
      return response.data || 0;
    } catch (error) {
      console.error('Lỗi khi lấy số đơn hoàn thành hôm nay:', error);
      return 0;
    }
  }

  /**
   * Lấy điểm đánh giá trung bình của kỹ thuật viên
   */
  public async getAverageRating(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/ratings/avg`);
      return response.data || 0;
    } catch (error) {
      console.error('Lỗi khi lấy điểm đánh giá trung bình:', error);
      return 0;
    }
  }

  /**
   * Lấy dữ liệu hiệu suất làm việc theo Tuần (số đơn hoàn thành theo từng ngày)
   */
  public async getWeeklyPerformance(technicianId: string, from: string, to: string): Promise<any[]> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/completed-weekly`, {
        params: { from, to }
      });
      return response.data || [];
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu hiệu suất tuần:', error);
      return [];
    }
  }

  /**
   * Lấy dữ liệu hiệu suất làm việc theo Tháng (số đơn hoàn thành theo từng ngày trong tháng)
   */
  public async getMonthlyPerformance(technicianId: string, year: number): Promise<any[]> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/completed-monthly`, {
        params: { year }
      });
      return response.data || [];
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu hiệu suất tháng:', error);
      return [];
    }
  }

  /**
   * Lấy tổng số lượng tất cả đơn hàng đã từng nhận
   */
  public async getTotalOrders(technicianId: string): Promise<number> {
    try {
      const response = await api.get(`/technician/statistic/${technicianId}/total`);
      return response.data || 0;
    } catch (error) {
      console.error('Lỗi khi lấy tổng số đơn hàng:', error);
      return 0;
    }
  }
}

export const statisticService = new StatisticService();
