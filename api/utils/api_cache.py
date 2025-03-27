import json
from datetime import datetime, timedelta
from django.core.cache import cache
import requests
import hashlib

class APICache:
    @staticmethod
    def get_cache_key(url, params=None):
        key_str = url
        if params:
            key_str += json.dumps(params, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    @staticmethod
    def get_cached_response(url, params=None, timeout=60*60):
        cache_key = APICache.get_cache_key(url, params)
        cached_response = cache.get(cache_key)
        
        if cached_response is not None:
            print(f"Cache hit for {cache_key}")
            return cached_response
        
        try:
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json() if 'application/json' in response.headers.get('Content-Type', '') else response.text
                cache.set(cache_key, data, timeout)
                return data
        except requests.RequestException:
            pass
        
        return None

    @staticmethod
    def invalidate_cache(url, params=None):
        cache_key = APICache.get_cache_key(url, params)
        cache.delete(cache_key)