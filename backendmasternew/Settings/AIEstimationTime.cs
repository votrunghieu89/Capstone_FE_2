using Capstone_2_BE.DTOs;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

namespace Capstone_2_BE.Settings
{
    public class AIEstimationTime
    {

        public class PredictionResponse
        {
            public int? prediction { get; set; }
            public string? error { get; set; }
        }

        private readonly HttpClient _httpClient;
        public AIEstimationTime(HttpClient httpClient)
        {
            _httpClient = httpClient;

        }

        public double CalculateDistance(decimal lat1, decimal lon1, decimal? lat2, decimal? lon2)
        {
            const double R = 6371; // Radius of Earth (km)

            double dLat = (double)(lat2 - lat1) * Math.PI / 180.0;
            double dLon = (double)(lon2 - lon1) * Math.PI / 180.0;

            double lat1Rad = (double)lat1 * Math.PI / 180.0;
            double lat2Rad = (double)lat2 * Math.PI / 180.0;

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }
            
        public async Task<double> EstimationTime(EstimationTimeDTO estimationTimeDTO) { 
            if (estimationTimeDTO == null) { return 0; }
            string url = "http://localhost:8011/predict";
           
            var requestData = new
            {
                service = estimationTimeDTO.ServiceName,
                distance = estimationTimeDTO.Distance,
                experience = estimationTimeDTO.Experience,
                is_peak_hour = estimationTimeDTO.IsPeakHour,
            };  
            var response = await _httpClient.PostAsJsonAsync(url, requestData);

            if (!response.IsSuccessStatusCode)
            {
                return 0; // hoặc throw exception
            }
            var result = await response.Content.ReadFromJsonAsync<PredictionResponse>();

            if (result == null || result.error != null)
            {
                Console.WriteLine(result?.error);
                return 0;
            }

            return (double)result.prediction;
        }

        public int isPeakHour()
        {
            int hour = DateTime.Now.Hour;
            return (hour >= 7 && hour <= 9) || (hour >= 14 && hour <= 19) ? 1 : 0;
        }
    }
}
