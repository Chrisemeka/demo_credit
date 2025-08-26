import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
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
        const response = await axios.get<KarmaApiResponse>(`${apiUrl}/verification/karma/:${email}`, {
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            }
        });
        if (response.data.status !== 'success') {
            console.error('Karma API call failed:', response.data.message);
        }
        if (!response.data.data) {
            return false;
        }
        const karmaData = response.data.data;
        return true;
        
    } catch (error) {
        throw new Error(`Error checking karma: ${error}`);
    }
};

export default karmaCheckMiddleWare;