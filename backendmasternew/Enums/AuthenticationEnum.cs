namespace Capstone_2_BE.Enums
{
    public class AuthenticationEnum
    {
        public enum Login
        {
            Success,
            Fail,
            Wrong,
            Banned
        }

        public enum Register
        {
            Success,
            Fail,
            Exsist
        }
    }
}
