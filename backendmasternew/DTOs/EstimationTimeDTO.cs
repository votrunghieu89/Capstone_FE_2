namespace Capstone_2_BE.DTOs
{
    public class EstimationTimeDTO
    {
        public string ServiceName { get; set; }
        public double Distance { get; set; }
        public double Experience { get; set; }

        public int IsPeakHour { get; set; }
    }
}
