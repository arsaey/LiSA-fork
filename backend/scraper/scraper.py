import requests
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from pathlib import Path
from typing import Dict, List, Tuple, Any
import config
from utils.headers import get_headers
import re


class Anime(ABC):
    site_url: str
    api_url: str
    video_file_name: str
    video_extension: str = ".mp4"

    @abstractmethod
    def search_anime(self, session, anime_name: str):
        ...

    @abstractmethod
    async def get_episode_sessions(self, session, anime_session: str):
        ...

    @abstractmethod
    def get_episode_stream_data(self, episode_session: str):
        ...


class Animepahe(Anime):
    site_url: str = "https://animepahe.com"
    api_url: str = "https://animepahe.com/api?"
    video_file_name: str = None  # variable will be assign while scraping for kwik f link
    manifest_location = "./uwu.m3u8"
    manifest_filename = "uwu.m3u8"
    master_manifest_location = "./master.m3u8"
    master_manifest_filename = "uwu.m3u8"

    def search_anime(self, session, input_anime):
        """A scraper for searching an anime user requested

        Args:
            session: request session object
            input_anime (str): name of the anime user entered

        Returns:
            json: response with the most significant match
        """
        search_headers = get_headers()

        search_params = {
            'm': 'search',
            'q': input_anime,
        }

        return session.get(f"{self.site_url}/api", params=search_params, headers=search_headers).json()["data"]

    def get_episode_sessions(self, session, anime_session: str, page_no: str = "1") -> List[Dict[str, str | int]] | None:
        """scraping the sessions of all the episodes of an anime

        Args:
            session: request session object
            anime_session (str): session of an anime (changes after each interval)
            page_no (str, optional): Page number when the episode number is greater than 30. Defaults to "1".

        Returns:
            List[Dict[str, str | int]] | None: Json with episode details
        """
        episodes_headers = get_headers({"referer": "{}/{}".format(self.site_url, anime_session)})

        episodes_params = {
            'm': 'release',
            'id': anime_session,
            'sort': 'episode_asc',
            'page': page_no,
        }

        return session.get(f"{self.site_url}/api", params=episodes_params, headers=episodes_headers).json()

    async def get_anime_description(self, session, anime_session: str) -> Dict[str, str]:
        """scraping the anime description

        Args:
            session: request session object
            anime_session (str): session of an anime (changes after each interval)

        Returns:
            Dict[str, str]: description {
                'Synopsis': str, 
                'eng_anime_name': str, 
                'Type': str, 
                'Episodes': str, 
                'Status': str, 
                'Aired': str, 
                'Season': str, 
                'Duration': str,
            }
        """
        description_header = get_headers({"referer": "{}/{}".format(self.site_url, anime_session)})
        description_response = session.get(f"{self.site_url}/anime/{anime_session}", headers=description_header)

        description_bs = BeautifulSoup(description_response.text, 'html.parser')

        description: Dict[str, Any] = {"external_links": {}}

        synopsis = description_bs.find('div', {'class': 'anime-synopsis'}).text.replace('\"', '')
        description['Synopsis'] = synopsis

        details: Dict[str, Any] = {}

        for info in description_bs.find('div', {'class': 'anime-info'}).find_all('p'):

            if info.has_attr("class"):
                if info["class"][0] == 'external-links':
                    for link in info.find_all("a", href=True):
                        description["external_links"][link.text] = f'https:{link["href"]}'
                    continue

            key, value = info.text.replace("\n", "").split(":", 1)
            details[key.lower()] = value

        description['eng_name'] = details.get("english", details.get("synonyms", "-"))
        description['duration'] = details.get("duration", "-")
        description["studio"] = details.get("studio", "-")

        return description

    def get_episode_stream_data(self, episode_session: str) -> Dict[str, List[Dict[str, str]]]:
        """getting the streaming details

        Args:
            episode_session (str): session of an episode (changes after each interval)

        Returns:
            Dict[str, List[Dict[str, str]]]: stream_data {
                'data':[{'quality': {'kwik_pahewin': str(url)}}]
            }
        """
        # episode_session = self.episode_session_dict[episode_no]
        # ep_headers = get_headers(extra='play/{}/{}'.format(anime_session, episode_session))

        ep_params = {
            'm': 'links',
            'id': episode_session,
            'p': 'kwik',
        }

        ep_headers = get_headers()

        return requests.get(f"{self.site_url}/api", params=ep_params, headers=ep_headers).json()["data"]

    async def get_manifest_file(self, kwik_url: str) -> (str, str):
        stream_headers = get_headers(extra={"referer": self.site_url})

        stream_response = requests.get(kwik_url, headers=stream_headers)
        if stream_response.status_code != 200:
            raise ValueError("Invalid Kwik URL")

        bs = BeautifulSoup(stream_response.text, 'html.parser')

        all_scripts = bs.find_all('script')
        pattern = r'\|\|\|.*\'\.'
        pattern_list = (re.findall(pattern, str(all_scripts[6]))[0]).split('|')[88:98]

        uwu_root_domain = f"https://{pattern_list[9]}-{pattern_list[8]}.{pattern_list[7]}.{pattern_list[6]}.{pattern_list[5]}"

        uwu_url = '{}/{}/{}/{}/{}.{}'.format(uwu_root_domain, pattern_list[4], pattern_list[3],
                                             pattern_list[2], pattern_list[1], pattern_list[0])

        return requests.get(uwu_url, headers=get_headers(extra={"origin": "https://kwik.cx", "referer": "https://kwik.cx/"})).text, uwu_root_domain


class MyAL:
    site_url: str = "https://myanimelist.net"

    anime_types_dict = {
        "airing": "airing",
        "upcoming": "upcoming",
        "tv": "tv",
        "movie": "movie",
        "ova": "ova",
        "ona": "ona",
        "special": "special",
        "by_popularity": "bypopularity",
        "favorite": "favorite",
    }

    def get_top_anime(self, anime_type: str, limit: str):
        """request to scrape top anime from MAL website
        Args:
            anime_type (str): either of ['airing', 'upcoming', 'tv', 'movie', 'ova', 'ona', 'special', 'by_popularity', 'favorite']
            limit (str): page number (number of tops in a page)
        Returns:
            Dict[str, Dict[str, str]]: {
                "<rank>" : {
                    "img_url" : (str)url,
                    "title" : (str), 
                    "anime_type" : (str),
                    "episodes" : (str), 
                    "score" : (str), 
                }, 
                ...
                "next_top":"api_server_address/top_anime?type=anime_type&limit=limit"
            }
        """
        top_anime_headers = get_headers()

        top_anime_params = {
            'type': self.anime_types_dict[anime_type],
            'limit': limit,
        }

        top_anime_response = requests.get(f'{self.site_url}/topanime.php', params=top_anime_params, headers=top_anime_headers)

        bs_top = BeautifulSoup(top_anime_response.text, 'html.parser')

        rank = bs_top.find_all("span", {"class": ['rank1', 'rank2', 'rank3', 'rank4']})
        ranks = []
        for i in rank:
            ranks.append(i.text)

        img = bs_top.find_all("img", {"width": "50", "height": "70"})
        imgs = []
        for x in img:
            src = x.get("data-src")
            start, end = 0, 0
            for i in range(len(src)):
                if src[i] == '/' and src[i + 1] == 'r':
                    start = i
                if src[i] == '/' and src[i + 1] == 'i':
                    end = i
            imgs.append(src.replace(src[start:end], ""))

        title = bs_top.find_all("h3", {"class": "anime_ranking_h3"})

        info = bs_top.find_all("div", {"class": "information"})
        episodes = []
        a_type = []
        for x in info:
            val = x.text.replace('\n', '').replace(' ', '')
            start, end = 0, 0
            for i in range(len(val)):
                if val[i] == '(':
                    start = i
                if val[i] == ')':
                    end = i
            episodes.append(val[start + 1:end])
            a_type.append(val[:start])

        score = bs_top.find_all("span", {"class": [
            "score-10", "score-9", "score-8", "score-7", "score-6", "score-5", "score-4", "score-3", "score-2",
            "score-1", "score-na"
        ]})

        top_anime = []

        for i in range(len(ranks)):
            rank = ranks[i]
            if ranks[i] == "-":
                rank = "na"
            top_anime.append({"rank": rank, "img_url": imgs[i], "title": title[i].text, "anime_type": a_type[i],
                              "episodes": episodes[i].replace('eps', ''), "score": score[i].text})

        response: Dict[str, Any] = {"data": top_anime}

        try:
            next_top = bs_top.find("a", {"class": "next"}).get("href")
            response["next_top"] = f"{config.API_SERVER_ADDRESS}/top_anime{next_top}"
        except AttributeError:
            response["next_top"] = None

        try:
            prev_top = bs_top.find("a", {"class": "prev"}).get("href")
            response["prev_top"] = f"{config.API_SERVER_ADDRESS}/top_anime{prev_top}"
        except AttributeError:
            response["prev_top"] = None

        return response
