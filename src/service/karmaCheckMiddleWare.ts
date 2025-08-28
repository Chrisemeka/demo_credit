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
            `${apiUrl}/verification/karma/identity?identity=${email}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Karma API Response:', JSON.stringify(response.data, null, 2));

        if (response.data.status !== 'success') {
            console.error('Karma API call failed:', response.data.message);
            return {
                isBlacklisted: false,
                reason: 'API_FAILED',
                message: response.data.message,
                rawResponse: response.data
            };
        }

        if (!response.data.data) {
            return {
                isBlacklisted: false,
                reason: 'NO_DATA',
                message: 'No karma data found',
                rawResponse: response.data
            };
        }

        const amountInContention = parseFloat(response.data.data.amount_in_contention || '0');
        const isBlacklisted = amountInContention > 5000;
        
        return {
            isBlacklisted: isBlacklisted,
            reason: isBlacklisted ? 'AMOUNT_EXCEEDED' : 'CLEAN',
            amountInContention: amountInContention,
            threshold: 5000,
            rawResponse: response.data
        };
        
    } catch (error) {
        console.error('Error checking karma:', error);
        return {
            isBlacklisted: false,
            reason: 'ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            error: error
        };
    }
};

export default karmaCheckMiddleWare;