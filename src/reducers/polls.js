import matter from 'gray-matter';
import uniqBy from 'lodash.uniqby';
import { createReducer } from '../utils/redux';
import { formatRound, check } from '../utils/misc';

// Mock Poll Data ----------------------------------------------

// Mocked poll data from the SDK/plugin
// const mockParsedAllPollsData = [
//   {
//     creator: '0xeda95d1bdb60f901986f43459151b6d1c734b8a2',
//     pollId: '1',
//     blockCreated: 123456789,
//     startTime: new Date('2019-06-25'),
//     endTime: new Date('2019-06-30'),
//     multiHash: 'QmbL3A3pz8j2NoWD18nt1PuKxqYh7Kk28jQK56nJaMcqcd',
//     source: '0xeda95d1bdb60f901986f43459151b6d1c734b8a2',
//     url:
//       'https://cms-gov.makerfoundation.com/content/governance-polling?pollId=1'
//   },
//   {
//     creator: '0xeda95d1bdb60f901986f43459151b6d1c734b8a2',
//     pollId: '2',
//     blockCreated: 123456789,
//     startTime: new Date('2019-07-09'),
//     endTime: new Date('2019-07-23'),
//     multiHash: 'QmPLpuz1VMtAapZJCb84NtRRUHVFsxGiX6kdb1ewsXxSSi',
//     source: '0xeda95d1bdb60f901986f43459151b6d1c734b8a2',
//     url:
//       'https://cms-gov.makerfoundation.com/content/governance-polling?pollId=2'
//   }
// ];

// Mock polls from the CMS
// const mockPollMd1 = {
//   about: `---
// title: Test Poll Inactive 1 (June 1)
// summary: This is a poll that ended in the past, and is inactive.
// discussion_link: https://www.reddit.com/r/mkrgov/
// rules:
// options:
//    0: Abstain
//    1: No Change
//    2: Vote Yes
//    3: Vote No
// ---
// # Poll: Test Poll Inactive 1 (June 1)

// This is a test poll that ended in the past, and is inactive. This text is dummy data.

// The Maker Foundation Interim Risk Team has placed a Governance Poll into the voting system which presents a number of possible Dai Stability Fee options. Voters are now able to signal their support for a Stability Fee within a range of 13.50% to 23.50%.

// This Governance Poll (FAQ) will be active for three days beginning on Monday, May 27 at 4 PM UTC, the results of which will inform an Executive Vote (FAQ) which will go live on Friday, May 31, at 4 PM UTC.`
// };

// const mockPollMd2 = {
//   about: `---
// title: Test Poll Active 1 (Jul 9)
// summary: This is a poll that is active for a week starting July 9th.
// discussion_link: https://www.reddit.com/r/mkrgov/
// rules:
// options:
//    0: Abstain
//    1: No Change
//    2: 5%
//    3: 25%
//    4: 75%
// ---
// # Poll: Test Poll Active 1 (Jul 9)

// This is a poll that is active for a week starting July 9th. This text is dummy data.

// The Maker Foundation Interim Risk Team has placed a Governance Poll into the voting system which presents a number of possible Dai Stability Fee options. Voters are now able to signal their support for a Stability Fee within a range of 13.50% to 23.50%.

// This Governance Poll (FAQ) will be active for three days beginning on Monday, May 27 at 4 PM UTC, the results of which will inform an Executive Vote (FAQ) which will go live on Friday, May 31, at 4 PM UTC.`
// };

// Mock voteHistory:
const mockHistory1 = {
  time: new Date(),
  options: [
    {
      option: 1,
      mkr: 100,
      percentage: 50
    },
    {
      option: 2,
      mkr: 200,
      percentage: 25
    },
    {
      option: 3,
      mkr: 300,
      percentage: 25
    }
  ]
};

const mockHistory2 = {
  time: new Date(),
  options: [
    {
      option: 1,
      mkr: 2100,
      percentage: 25
    },
    {
      option: 2,
      mkr: 2200,
      percentage: 25
    },
    {
      option: 3,
      mkr: 2300,
      percentage: 25
    },
    {
      option: 4,
      mkr: 2400,
      percentage: 25
    }
  ]
};

// const mockFetchPollFromCms = async pollId => {
//   switch (pollId) {
//     case '1':
//       return mockPollMd1;
//     case '2':
//       return mockPollMd2;
//     default:
//       break;
//   }
// };

const mockGetVoteHistory = async pollId => {
  switch (pollId) {
    case '1':
      return mockHistory1;
    case '2':
      return mockHistory2;
    default:
      return mockHistory1;
  }
};
// Constants ----------------------------------------------

export const POLLS_REQUEST = 'polls/REQUEST';
export const POLLS_SUCCESS = 'polls/SUCCESS';
export const POLLS_FAILURE = 'polls/FAILURE';

export const POLLS_SET_OPTION_VOTING_FOR = 'polls/SET_OPTION_VOTING_FOR';
export const POLLS_WITHDRAW_OPTION_VOTING_FOR =
  'polls/WITHDRAW_OPTION_VOTING_FOR';

// Actions ----------------------------------------------

export const pollsRequest = () => ({
  type: POLLS_REQUEST
});
export const pollsSuccess = polls => ({
  type: POLLS_SUCCESS,
  payload: polls
});
export const pollsFailure = () => ({
  type: POLLS_FAILURE
});

export const setOptionVotingFor = (pollId, optionId) => ({
  type: POLLS_SET_OPTION_VOTING_FOR,
  payload: { pollId, optionId }
});
export const withdrawOptionVotingFor = pollId => ({
  type: POLLS_WITHDRAW_OPTION_VOTING_FOR,
  payload: { pollId }
});

// Writes ---

export const voteForPoll = (pollId, optionId) => async dispatch => {
  console.log('vote for poll', pollId, optionId);
  const pollVote = await window.maker
    .service('govPolling')
    .vote(pollId, optionId);
  console.log('^^^pollVote', pollVote);
  dispatch(setOptionVotingFor(pollId, optionId));
};

export const withdrawVoteForPoll = pollId => dispatch => {
  console.log('withdraw vote for poll', pollId);
  // const pollVote = window.maker.service('govPolling').withdraw(pollId);
  dispatch(withdrawOptionVotingFor(pollId));
};

// Reads ---

const getAllWhiteListedPolls = async () => {
  const pollsList = await window.maker
    .service('govPolling')
    .getAllWhitelistedPolls();

  const polls = uniqBy(pollsList, p => p.url);
  console.log('unique polls', polls);
  return polls;
};

export const getOptionVotingFor = (address, pollId) => async dispatch => {
  const optionId = await window.maker
    .service('govPolling')
    .getOptionVotingFor(address, pollId);
  dispatch(setOptionVotingFor(pollId, optionId));
};

const fetchPollFromUrl = async url => {
  console.log('url to fetch', url);
  const res = await fetch(url);
  await check(res);
  const json = await res.json();
  if (!json['voteId']) {
    return null;
  } else {
    console.log('valid poll', json);
    return json;
  }
};

const formatOptions = options => {
  return Object.values(options);
};

const formatYamlToJson = data => {
  const json = matter(data.about);
  const { content } = json;
  const { title, summary, options, discussion_link } = json.data;
  return {
    voteId: data.voteId,
    title,
    summary,
    options: formatOptions(options),
    discussion_link,
    content,
    rawData: data.about
  };
};

const isPollActive = (startDate, endDate) => {
  const now = new Date();
  return startDate <= now && endDate > now ? true : false;
};

export const getVoteBreakdown = async (pollId, options) => {
  // TODO replace this with SDK method:
  const { options: breakdownOpts } = await mockGetVoteHistory(pollId);

  // const vh = await window.maker.service('govPolling').getVoteHistory(pollId);
  // console.log('^^voteHistory', vh);

  const voteBreakdown = breakdownOpts.reduce((result, val) => {
    const currentOpt = options[val.option];
    const breakdown = {
      name: currentOpt,
      value: `${val.mkr} MKR (${val.percentage}%)`
    };
    result.push(breakdown);
    return result;
  }, []);

  return voteBreakdown;
};

export const pollsInit = () => async dispatch => {
  const pollService = window.maker.service('govPolling');
  dispatch(pollsRequest());

  const allPolls = [];

  try {
    const polls = await getAllWhiteListedPolls();

    for (const poll of polls) {
      const cmsData = await fetchPollFromUrl(poll.url);
      // console.log('cmsData for valid poll', cmsData);
      if (cmsData === null) continue;
      // const cmsData = await mockFetchPollFromCms(poll.pollId);
      const cmsPoll = formatYamlToJson(cmsData);
      console.log('cmsPOLL for valid poll', cmsPoll);

      const pollData = { ...poll, ...cmsPoll };

      // TODO keep track of these methods as the SDK methods are implemented

      // TODO this is failing for me locally with a poll that has a vote for it:
      // const totalVotes = await pollService.getMkrAmtVoted(pollData.pollId);
      // console.log('^^1totalVotes', totalVotes);
      pollData.totalVotes = '1200';

      // const participation = await pollService.getPercentageMkrVoted(
      //   pollData.pollId
      // // );
      // console.log('^^2participation', participation);
      pollData.participation = '12';

      const numUniqueVoters = await pollService.getNumUniqueVoters(
        pollData.pollId
      );
      console.log('^^3numUniqueVoters', numUniqueVoters);
      pollData.numUniqueVoters = numUniqueVoters;

      pollData.active = isPollActive(pollData.startDate, pollData.endDate);
      if (!pollData.active) pollData.winningProposal = 'Mock Winning Proposal';
      const winningPro = await pollService.getWinningProposal(pollData.pollId);
      console.log('^^4winningPro, active?', !pollData.active, winningPro);

      const voteBreakdown = await getVoteBreakdown(
        pollData.pollId,
        pollData.options
      );
      pollData.voteBreakdown = voteBreakdown;

      // TODO: pull the Polling address from the correct json file
      pollData.source = '0x518a0702701BF98b5242E73b2368ae07562BEEA3';

      allPolls.push(pollData);
    }
  } catch (error) {
    console.error(error);
    dispatch(pollsFailure());
  }

  dispatch(pollsSuccess(allPolls));
};

export const formatHistoricalPolls = topics => async dispatch => {
  const govTopics = topics.filter(t => t.govVote === true);
  const allPolls = govTopics.reduce(
    (
      result,
      { active, end_timestamp, date, topic_blurb, topic, key, proposals }
    ) => {
      const options = proposals.map(p => p.title);
      const totalVotes = proposals.reduce(
        (acc, proposal) => acc + proposal.end_approvals,
        0
      );

      const poll = {
        legacyPoll: true,
        active: false,
        blockCreated: 'na',
        content: proposals[0] ? proposals[0].about : topic_blurb,
        creator: '0xeda95d1bdb60f901986f43459151b6d1c734b8a2',
        endDate: new Date(end_timestamp),
        options: options,
        source: '0xeda95d1bdb60f901986f43459151b6d1c734b8a2',
        startDate: new Date(date),
        summary: topic_blurb,
        title: topic,
        totalVotes: formatRound(totalVotes),
        pollId: key,
        voteId: key
        // multiHash: 'na',
        // discussionLink: 'https://www.reddit.com/r/mkrgov/',
        // numUniqueVoters: '700',
        // participation: '12',
        // pollId: '2',
      };

      result.push(poll);
      return result;
    },
    []
  );
  dispatch(pollsSuccess(allPolls));
};

// Reducer ------------------------------------------------

export default createReducer([], {
  [POLLS_SUCCESS]: (state, { payload }) => [...state, ...payload],
  [POLLS_SET_OPTION_VOTING_FOR]: (state, { payload }) => {
    console.log('payload', payload);
    return state.map(poll => {
      if (poll.pollId === payload.pollId) {
        return {
          ...poll,
          optionVotingFor: payload.optionId
        };
      }
      return poll;
    });
  },
  [POLLS_WITHDRAW_OPTION_VOTING_FOR]: (state, { payload }) => {
    return state.map(poll => {
      if (poll.pollId === payload.pollId) {
        return {
          ...poll,
          optionVotingFor: null
        };
      }
      return poll;
    });
  }
});
