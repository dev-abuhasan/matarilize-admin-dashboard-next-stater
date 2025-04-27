import { getServerSession } from 'next-auth'

import { getSession } from 'next-auth/react'

import { authOptions } from '@/app/api/auth/[...nextauth]/auth'


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

const isServer = typeof window === 'undefined'

const getToken = async (refresh?: boolean): Promise<string | null> => {
    if (isServer) {
        const session = await getServerSession(authOptions)

        return refresh ? session?.refreshToken || null : session?.accessToken || null
    } else {
        const session = await getSession()

        return refresh ? session?.refreshToken || null : session?.accessToken || null
    }
}

const getUrl = (endpoint: string) => `${API_BASE_URL}/${endpoint}`;

const handleResponse = async ({ endpoint, method, body, headers, source, jsonType }: any): Promise<any> => {
    const refreshToken = await getToken(true);

    if (!refreshToken) {
        console.error('No refresh token found');

        return;
    }

    try {
        const refreshTokenResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include',
        });

        const refreshTokenData = await refreshTokenResponse.json();

        if (refreshTokenData.status === 'success') {
            const newAccessToken = refreshTokenData.data.tokens.accessToken;

            // 👇 RETRY request with new access token
            return await request({
                endpoint,
                method,
                body,
                headers: {
                    ...headers,
                    Authorization: `Bearer ${newAccessToken}`
                },
                source,
                jsonType
            });
        } else {
            console.log('Refresh Token Error ----->', refreshTokenData);
        }
    } catch (error) {
        console.log('Handle response error ----->', error);
    }
}


export const request = async ({
    endpoint,
    method = 'GET',
    body,
    headers = {},
    source = null,
    jsonType = false
}: {
    endpoint: string
    method?: string
    body?: any
    headers?: any
    source?: { token: AbortSignal } | null
    jsonType?: boolean
}) => {
    const accessToken = await getToken();

    console.log(accessToken)

    const authHeaders: Record<string, string> = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}

    const url = getUrl(endpoint)

    try {
        const requestBody = body
            ? jsonType
                ? JSON.stringify(body)
                : body instanceof FormData
                    ? body
                    : new URLSearchParams(body instanceof Object ? Object.entries(body) : body)
            : undefined

        const fetchOptions: RequestInit = {
            method,
            headers: {
                ...(isServer && { 'X-Token': process.env.API_KEY || '' }),
                ...headers,
                ...authHeaders,
                ...(jsonType ? { 'Content-Type': 'application/json' } : {})
            },
            credentials: 'include',
            signal: source?.token
        }

        if (body && method !== 'GET') {
            fetchOptions.body = requestBody
        }

        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
            if (response.status === 401 && !isServer) {
                // return handleResponse({ endpoint, method, body, headers, source, jsonType })
                console.log('Unauthorized ----->', response)
            } else if (response.status === 503) {
                window.location.href = '/maintanance'
            }

            console.log('Url ----->', url)
            console.log('Response ----->', response)
        }

        const contentType = response.headers.get('Content-Type')

        if (contentType?.startsWith('image/')) {
            const blob = await response.blob()


            return { status: 'success', data: blob }
        } else {
            return await response.json()
        }
    } catch (error) {
        console.error('Request Error: ', error)
    }
}

// companies
export const getCompanies = async () => {
    return await request({
        endpoint: 'companies'
    })
}
