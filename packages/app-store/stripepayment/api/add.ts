import type { NextApiRequest, NextApiResponse } from "next";
import { stringify } from "querystring";

import { BASE_URL } from "@calcom/lib/constants";
import prisma from "@calcom/prisma";

const client_id = process.env.STRIPE_CLIENT_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Get user
    const user = await prisma.user.findUnique({
      where: {
        id: req.session?.user?.id,
      },
      select: {
        email: true,
        name: true,
      },
    });

    const redirect_uri = encodeURI(BASE_URL + "/api/integrations/stripepayment/callback");
    const stripeConnectParams = {
      client_id,
      scope: "read_write",
      response_type: "code",
      "stripe_user[email]": user?.email,
      "stripe_user[first_name]": user?.name,
      /** We need this so E2E don't fail for international users */
      "stripe_user[country]": process.env.NEXT_PUBLIC_IS_E2E ? "US" : undefined,
      redirect_uri,
    };
    const query = stringify(stripeConnectParams);
    /**
     * Choose Express or Standard Stripe accounts
     * @url https://stripe.com/docs/connect/accounts
     */
    // const url = `https://connect.stripe.com/express/oauth/authorize?${query}`;
    const url = `https://connect.stripe.com/oauth/authorize?${query}`;

    res.status(200).json({ url });
  }
}
