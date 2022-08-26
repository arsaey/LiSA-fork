import {
  Box,
  Center,
  Flex,
  Heading,
  Skeleton,
  Spacer,
  Stack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Select } from "@chakra-ui/react";
import { AiFillFilter } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { getExploreDetails } from "../actions/animeActions";
import Card from "../components/card";
// import { useNavigate } from "react-router-dom";

const ExploreScreen = () => {
  const [query, setQuery] = useState("airing");
  const { loading, details } = useSelector((state) => {
    console.log(state);
    return state.animeExploreDetails;
  });
  const filterChangeHandler = (e) => {
    setQuery(e.target.value);
  };
  console.log(query);

  const dispatch = useDispatch();
  useEffect(() => {
    if (!details) {
      dispatch(getExploreDetails(query));
    }
  }, [query]);

  return (
    <Center py={6} w="100%">
      <Stack
        borderWidth="1px"
        borderRadius="lg"
        w={{ sm: "100%", md: "90%" }}
        direction={"column"}
        bg={"gray.900"}
        boxShadow={"2xl"}
        padding={4}
      >
        <Flex justifyContent={"space-between"} w={"100%"}>
          <Heading fontSize={"2xl"} fontFamily={"body"}>
            Explore
          </Heading>
          <Spacer />
          <Select
            onChange={filterChangeHandler}
            placeholder="Select option"
            maxWidth={"150px"}
            icon={<AiFillFilter />}
            value={query}
          >
            <option value="airing">Airing</option>
            <option value="upcoming">Upcoming</option>
            <option value="by_popularity">By Popularity</option>
            <option value="movie">Movie</option>

            <option value="tv">TV</option>
          </Select>
        </Flex>

        <div style={{ maxWidth: "1200px", margin: " 0 auto" }}></div>
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            listStyle: "none",
            margin: 0,
            padding: 0,
            marginTop: "20px"
          }}
        >
          {details &&
            details?.data?.map((anime) => {
              return <Card data={anime} />;
            })}
        </ul>

        <Flex gap={6} flexWrap="wrap"></Flex>
      </Stack>
    </Center>
  );
};

export default ExploreScreen;
