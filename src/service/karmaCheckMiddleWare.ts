import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

interface KarmaApiResponse {
  status: string;
  message: string;
  data: {
    karma_identity: string;
    amount_in_contention: string;
    reason: string | null;
    default_date: string;
    karma_type: {
      karma: string;
    };
    karma_identity_type: {
      identity_type: string;
    };
    reporting_entity: {
      name: string;
      email: string;
    };
  };
  meta: {
    cost: number;
    balance: number;
  };
}

const karmaCheckMiddleWare = async (email: string) => {
    const apiUrl = process.env.ADJUTOR_API_BASE_URL!;
    const apiKey = process.env.ADJUTOR_API_KEY!;

    try {
      const response = await axios.get<KarmaApiResponse>(
          `${apiUrl}/verification/karma/${email}`,
          {
              headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
              }
          }
      );

      if (response.data.status !== 'success') {
          console.error('Karma API call failed:', response.data.message);
          return true;
      }

      if (!response.data.data) {
          return false;
      }

      const amountInContention = parseFloat(response.data.data.amount_in_contention || '0');
      
      return amountInContention > 5000;
      
    } catch (error) {
        console.error('Error checking karma:', error);
        return true; 
    }
};

export default karmaCheckMiddleWare;