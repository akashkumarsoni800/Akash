import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array"; // Ye line add ki hai taki Array error na aaye
import AccessControl "access-control";

module {
        public type ApprovalStatus = {
                #approved;
                    #rejected;
                        #pending;
        };

          public type UserApprovalInfo = {
                principal : Principal;
                    status : ApprovalStatus;
          };

            public type ApprovalState = {
                      approvalStatus : HashMap.HashMap<Principal, ApprovalStatus>;
            };

              public func initState(accessControlState : AccessControl.AccessControlState) : ApprovalState {
                      let approvalStatus = HashMap.HashMap<Principal, ApprovalStatus>(0, Principal.equal, Principal.hash);
                          
                              // Admin ko approved aur baaki ko pending set karte hain
                                  for ((principal, role) in accessControlState.userRoles.entries()) {
                                          let status : ApprovalStatus = switch (role) {
                                                        case (#admin) { #approved };
                                                                case (_) { #pending };
                                          };
                                                approvalStatus.put(principal, status);
                                  };
                                      
                                          { approvalStatus = approvalStatus };
              };

                public func isApproved(state : ApprovalState, caller : Principal) : Bool {
                      switch (state.approvalStatus.get(caller)) {
                              case (?#approved) { true };
                                    case (_) { false };
                      };
                };

                  public func requestApproval(state : ApprovalState, caller : Principal) {
                            switch (state.approvalStatus.get(caller)) {
                                    case (null) {
                                                  setApproval(state, caller, #pending);
                                    };
                                          case (_) {}; 
                            };
                  };

                    public func setApproval(state : ApprovalState, user : Principal, approval : ApprovalStatus) {
                            state.approvalStatus.put(user, approval);
                    };

                      public func listApprovals(state : ApprovalState) : [UserApprovalInfo] {
                            let entries = state.approvalStatus.entries();
                                var approvals : [UserApprovalInfo] = [];
                                    
                                        for ((p, s) in entries) {
                                                let info : UserApprovalInfo = {
                                                              principal = p;
                                                                      status = s;
                                                };
                                                      approvals := Array.append(approvals, [info]);
                                        };
                                            approvals;
                      };
};