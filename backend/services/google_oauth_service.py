import requests
import json
import logging
from urllib.parse import urlencode
from config.google_config import (
    GOOGLE_CLIENT_ID, 
    GOOGLE_CLIENT_SECRET, 
    GOOGLE_REDIRECT_URI,
    GOOGLE_SCOPES,
    GOOGLE_AUTH_URL,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL
)

logger = logging.getLogger(__name__)

class GoogleOAuthService:
    """Service for handling Google OAuth operations"""
    
    @staticmethod
    def _validate_env():
        missing = []
        if not GOOGLE_CLIENT_ID or not isinstance(GOOGLE_CLIENT_ID, str):
            missing.append('GOOGLE_CLIENT_ID')
        if not GOOGLE_CLIENT_SECRET or not isinstance(GOOGLE_CLIENT_SECRET, str):
            missing.append('GOOGLE_CLIENT_SECRET')
        if not GOOGLE_REDIRECT_URI or not isinstance(GOOGLE_REDIRECT_URI, str):
            missing.append('GOOGLE_REDIRECT_URI')
        if missing:
            raise ValueError(f"Missing or invalid Google OAuth env vars: {', '.join(missing)}")

    @staticmethod
    def get_authorization_url():
        """Generate Google OAuth authorization URL"""
        try:
            GoogleOAuthService._validate_env()
            params = {
                'client_id': str(GOOGLE_CLIENT_ID),
                'redirect_uri': str(GOOGLE_REDIRECT_URI),
                'scope': ' '.join(GOOGLE_SCOPES),
                'response_type': 'code',
                'access_type': 'offline',
                'prompt': 'consent'
            }
            
            auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
            logger.info(f"Generated Google authorization URL")
            return auth_url
            
        except Exception as e:
            logger.exception("Error generating authorization URL")
            return None
    
    @staticmethod
    def exchange_code_for_tokens(authorization_code):
        """Exchange authorization code for access and refresh tokens"""
        try:
            GoogleOAuthService._validate_env()
            if not authorization_code or not isinstance(authorization_code, str):
                raise ValueError('Authorization code is missing or invalid')

            logger.info("Exchanging authorization code for tokens")
            
            token_data = {
                'client_id': str(GOOGLE_CLIENT_ID),
                'client_secret': str(GOOGLE_CLIENT_SECRET),
                'code': authorization_code,
                'grant_type': 'authorization_code',
                'redirect_uri': str(GOOGLE_REDIRECT_URI)
            }
            
            response = requests.post(GOOGLE_TOKEN_URL, data=token_data)
            if not response.ok:
                logger.error(f"Token exchange failed: status={response.status_code}, body={response.text}")
                response.raise_for_status()
            
            tokens = response.json()
            logger.info("Successfully exchanged code for tokens")
            
            return {
                'access_token': tokens.get('access_token'),
                'refresh_token': tokens.get('refresh_token'),
                'expires_in': tokens.get('expires_in')
            }
            
        except requests.exceptions.RequestException as e:
            logger.exception("HTTP error exchanging code for tokens")
            return None
        except Exception as e:
            logger.exception("Unexpected error in token exchange")
            return None
    
    @staticmethod
    def get_user_info(access_token):
        """Get user information from Google using access token"""
        try:
            if not access_token or not isinstance(access_token, str):
                raise ValueError('Access token is missing or invalid')

            logger.info("Fetching user info from Google")
            
            headers = {
                'Authorization': f'Bearer {access_token}'
            }
            
            response = requests.get(GOOGLE_USERINFO_URL, headers=headers)
            if not response.ok:
                logger.error(f"Userinfo fetch failed: status={response.status_code}, body={response.text}")
                response.raise_for_status()
            
            user_info = response.json()
            logger.info(f"Successfully fetched user info for: {user_info.get('email')}")
            
            # Map Google user data to our format
            mapped_user_data = {
                'id': user_info.get('id'),
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'given_name': user_info.get('given_name'),
                'family_name': user_info.get('family_name'),
                'picture': user_info.get('picture'),
                'verified_email': user_info.get('verified_email'),
                'locale': user_info.get('locale')
            }
            
            return mapped_user_data
            
        except requests.exceptions.RequestException as e:
            logger.exception("HTTP error fetching user info")
            return None
        except Exception as e:
            logger.exception("Unexpected error fetching user info")
            return None
    
    @staticmethod
    def refresh_access_token(refresh_token):
        """Refresh access token using refresh token"""
        try:
            GoogleOAuthService._validate_env()
            if not refresh_token or not isinstance(refresh_token, str):
                raise ValueError('Refresh token is missing or invalid')

            logger.info("Refreshing access token")
            
            token_data = {
                'client_id': str(GOOGLE_CLIENT_ID),
                'client_secret': str(GOOGLE_CLIENT_SECRET),
                'refresh_token': refresh_token,
                'grant_type': 'refresh_token'
            }
            
            response = requests.post(GOOGLE_TOKEN_URL, data=token_data)
            if not response.ok:
                logger.error(f"Refresh token request failed: status={response.status_code}, body={response.text}")
                response.raise_for_status()
            
            tokens = response.json()
            logger.info("Successfully refreshed access token")
            
            return {
                'access_token': tokens.get('access_token'),
                'expires_in': tokens.get('expires_in')
            }
            
        except requests.exceptions.RequestException as e:
            logger.exception("HTTP error refreshing access token")
            return None
        except Exception as e:
            logger.exception("Unexpected error refreshing token")
            return None
